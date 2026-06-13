const { app, BrowserWindow, ipcMain, nativeTheme, Menu, shell, nativeImage, session, globalShortcut } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const iconPath = path.join(__dirname, '..', 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png')
const appIcon = nativeImage.createFromPath(iconPath)
const Store = require('electron-store')
const { v4: uuidv4 } = require('uuid')
const contextMenu = require('electron-context-menu')
const { DEFAULT_WORKSPACES } = require('../shared/constants')
const { initEncryption, encryptText, decryptText, getEncryptionStatus } = require('./encryption')
const aiService = require('./aiService')

const isDev = process.env.NODE_ENV === 'development'

// Native Cut/Copy/Paste/spell-check menu for all windows. Editor selections
// call e.preventDefault() on their own contextmenu event to show the custom
// AI action menu instead, which suppresses this for that case.
contextMenu({
  showInspectElement: isDev,
})

// Auto-updates: let the user decide when to download, and skip signature
// verification since builds aren't code-signed yet.
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.verifyUpdateCodeSignature = false

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

Store.initRenderer()

const store = new Store({
  defaults: {
    notes: {},
    workspaces: DEFAULT_WORKSPACES.reduce((acc, ws) => {
      acc[ws.id] = { ...ws, createdAt: new Date().toISOString() }
      return acc
    }, {}),
    settings: {
      theme: 'system',
      fontSize: 'medium',
      autoSaveInterval: 2000,
      fontFamily: 'Google Sans',
      startMinimized: false,
    },
  },
})

let mainWindow = null
let quickCaptureWindow = null

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', { status, ...data })
  }
}

// Tracks where we are in the update lifecycle so the periodic background
// check (and the renderer's "Download" button) can't re-trigger a check or
// a fresh 70MB download while one is already running or already finished —
// otherwise an update left downloaded-but-not-installed gets re-downloaded
// on every hourly recheck.
let updateState = 'idle' // idle | checking | available | downloading | downloaded

function safeCheckForUpdates() {
  if (updateState === 'checking' || updateState === 'downloading' || updateState === 'downloaded') return
  autoUpdater.checkForUpdates().catch(() => {})
}

autoUpdater.on('checking-for-update', () => {
  updateState = 'checking'
  sendUpdateStatus('checking')
})
autoUpdater.on('update-available', (info) => {
  // Already downloaded and waiting for the user to restart — don't
  // re-prompt "Update available" and overwrite that toast.
  if (updateState === 'downloaded') return
  updateState = 'available'
  sendUpdateStatus('available', { version: info.version })
})
autoUpdater.on('update-not-available', () => {
  updateState = 'idle'
  sendUpdateStatus('not-available')
})
autoUpdater.on('error', (err) => {
  if (updateState !== 'downloaded') updateState = 'idle'
  sendUpdateStatus('error', { message: err?.message || String(err) })
})
autoUpdater.on('download-progress', (progress) => {
  updateState = 'downloading'
  sendUpdateStatus('downloading', { percent: progress.percent })
})
autoUpdater.on('update-downloaded', (info) => {
  updateState = 'downloaded'
  store.set('pendingWhatsNew', { version: info.version })
  sendUpdateStatus('downloaded', { version: info.version })
})

// Title and content are the sensitive parts of a note; everything else
// (tags, color, flags, timestamps) stays plaintext for cheap filtering/sorting.
function encryptNote(note) {
  return {
    ...note,
    title: encryptText(note.title ?? ''),
    content: encryptText(note.content ?? ''),
  }
}

function decryptNote(note) {
  if (!note) return note
  return {
    ...note,
    title: decryptText(note.title ?? ''),
    content: decryptText(note.content ?? ''),
  }
}

function createMainWindow() {
  const { width, height, x, y } = store.get('windowState', { width: 1400, height: 900 })

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    backgroundColor: '#0f1117',
    icon: appIcon,
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'midi', 'midiSysex', 'clipboard-read', 'clipboard-sanitized-write']
    callback(allowed.includes(permission))
  })

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') return true
    return false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.setIcon(appIcon)
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Remember window size/position so the app reopens where the user left it
  let saveStateTimer = null
  const saveWindowState = () => {
    clearTimeout(saveStateTimer)
    saveStateTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) store.set('windowState', mainWindow.getBounds())
    }, 500)
  }
  mainWindow.on('resize', saveWindowState)
  mainWindow.on('move', saveWindowState)
  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) store.set('windowState', mainWindow.getBounds())
  })

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    if (mainWindow) mainWindow.webContents.send('theme:changed', theme)
  })

  Menu.setApplicationMenu(null)
}

const QUICK_CAPTURE_WIDTH = 480
const QUICK_CAPTURE_HEIGHT = 180
const QUICK_CAPTURE_MAX_HEIGHT = 480

function createNoteRecord(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    title: '',
    content: '',
    tags: [],
    color: 'default',
    pinned: false,
    favorite: false,
    archived: false,
    trashed: false,
    workspaceId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function getQuickCaptureWindow() {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) return quickCaptureWindow

  quickCaptureWindow = new BrowserWindow({
    width: QUICK_CAPTURE_WIDTH,
    height: QUICK_CAPTURE_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    quickCaptureWindow.loadURL('http://localhost:5173/?mode=quickcapture')
  } else {
    quickCaptureWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { mode: 'quickcapture' },
    })
  }

  quickCaptureWindow.on('closed', () => {
    quickCaptureWindow = null
  })

  return quickCaptureWindow
}

// Alt+Space toggles the popup: show it centered near the cursor's display,
// or ask the renderer to save/dismiss its draft if it's already open.
function toggleQuickCapture() {
  const win = getQuickCaptureWindow()

  if (win.isVisible()) {
    win.webContents.send('quickCapture:dismiss')
    return
  }

  // `screen` is exposed via a lazy getter that only resolves once the app is
  // ready, so it must be read here rather than destructured at module load.
  const { screen } = require('electron')
  const { x, y, width } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  win.setBounds({
    x: Math.round(x + (width - QUICK_CAPTURE_WIDTH) / 2),
    y: Math.round(y + 120),
    width: QUICK_CAPTURE_WIDTH,
    height: QUICK_CAPTURE_HEIGHT,
  })

  win.show()
  win.focus()
  win.webContents.send('quickCapture:shown')
}

// Reads the OpenRouter key from Settings, decrypting it for use with the API client.
function getOpenRouterKey() {
  const { openRouterApiKey } = store.get('settings', {})
  return openRouterApiKey ? decryptText(openRouterApiKey) : null
}

function friendlyAIError(err) {
  const status = err.status ?? err.response?.status
  if (status === 429) return 'OpenRouter quota exceeded — check your account at openrouter.ai'
  if (status === 401 || err.message?.includes('API key')) return 'Invalid OpenRouter API key'
  return err.message || 'AI request failed'
}

app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-http-cache')

if (process.platform === 'win32') app.setAppUserModelId('com.smart-notepad.app')

app.whenReady().then(async () => {
  initEncryption()
  // Clear corrupted disk cache on startup to prevent backend_impl errors
  try { await session.defaultSession.clearCache() } catch {}
  createMainWindow()

  // Global Quick Capture: works system-wide while the app is running,
  // even if the main window isn't focused or visible.
  if (!globalShortcut.register('Alt+Space', toggleQuickCapture)) {
    console.warn('Quick Capture: failed to register Alt+Space global shortcut')
  }

  // Silent check on launch, then periodically while the app stays open,
  // so updates are picked up without the user clicking "Check for Updates".
  if (app.isPackaged) {
    setTimeout(safeCheckForUpdates, 3000)
    setInterval(safeCheckForUpdates, UPDATE_CHECK_INTERVAL_MS)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// ── IPC: Notes ────────────────────────────────────────────────────────────────

ipcMain.handle('notes:getAll', () => {
  return Object.values(store.get('notes', {})).map(decryptNote)
})

ipcMain.handle('notes:create', (_, data) => {
  const note = createNoteRecord(data)
  store.set(`notes.${note.id}`, encryptNote(note))
  return note
})

ipcMain.handle('notes:update', (_, id, updates) => {
  const notes = store.get('notes', {})
  if (!notes[id]) return null
  const existing = decryptNote(notes[id])
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  store.set(`notes.${id}`, encryptNote(updated))
  return updated
})

ipcMain.handle('notes:delete', (_, id) => {
  store.delete(`notes.${id}`)
  return true
})

// ── IPC: Workspaces ───────────────────────────────────────────────────────────

ipcMain.handle('workspaces:getAll', () => {
  return Object.values(store.get('workspaces', {}))
})

ipcMain.handle('workspaces:create', (_, data) => {
  const workspace = {
    id: uuidv4(),
    name: 'New Workspace',
    icon: '📁',
    color: '#6366f1',
    createdAt: new Date().toISOString(),
    ...data,
  }
  store.set(`workspaces.${workspace.id}`, workspace)
  return workspace
})

ipcMain.handle('workspaces:update', (_, id, updates) => {
  const workspaces = store.get('workspaces', {})
  if (!workspaces[id]) return null
  const updated = { ...workspaces[id], ...updates }
  store.set(`workspaces.${id}`, updated)
  return updated
})

ipcMain.handle('workspaces:delete', (_, id) => {
  store.delete(`workspaces.${id}`)
  return true
})

// ── IPC: Settings ─────────────────────────────────────────────────────────────

ipcMain.handle('settings:get', () => {
  const settings = store.get('settings', {})
  if (settings.openRouterApiKey) {
    return { ...settings, openRouterApiKey: decryptText(settings.openRouterApiKey) }
  }
  return settings
})

ipcMain.handle('settings:set', (_, data) => {
  const current = store.get('settings', {})
  const updated = { ...current, ...data }
  // Only re-encrypt when this call actually provides a new key — `current.openRouterApiKey`
  // is already ciphertext, so encrypting it again on unrelated settings updates would
  // double-encrypt it and corrupt the stored key.
  if (typeof data.openRouterApiKey === 'string') {
    updated.openRouterApiKey = encryptText(data.openRouterApiKey)
  }
  store.set('settings', updated)
  return updated
})

// ── IPC: AI ───────────────────────────────────────────────────────────────────

ipcMain.handle('ai:status', () => {
  return { configured: Boolean(getOpenRouterKey()) }
})

ipcMain.handle('ai:processText', async (_, action, text) => {
  try {
    const result = await aiService.processText(getOpenRouterKey(), action, text)
    return { result }
  } catch (err) {
    return { error: friendlyAIError(err) }
  }
})

ipcMain.handle('ai:askNotes', async (_, question, notes, history) => {
  try {
    return await aiService.askNotes(getOpenRouterKey(), question, notes, history)
  } catch (err) {
    return { error: friendlyAIError(err) }
  }
})

// ── IPC: Encryption ───────────────────────────────────────────────────────────

ipcMain.handle('encryption:status', () => {
  return getEncryptionStatus()
})

// ── IPC: Quick Capture ────────────────────────────────────────────────────────

ipcMain.handle('quickCapture:save', (_, content) => {
  const win = quickCaptureWindow
  if (!String(content ?? '').replace(/<[^>]*>/g, '').trim()) {
    if (win && !win.isDestroyed()) win.hide()
    return null
  }

  const note = createNoteRecord({ content })
  store.set(`notes.${note.id}`, encryptNote(note))

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notes:created', note)
  }
  if (win && !win.isDestroyed()) win.hide()
  return note
})

ipcMain.handle('quickCapture:close', () => {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) quickCaptureWindow.hide()
  return true
})

// Grows/shrinks the popup as its content does. Sent continuously while the
// renderer's GSAP resize animation runs, so this stays a fire-and-forget
// `send` rather than an `invoke` round trip.
ipcMain.on('quickCapture:resize', (_, height) => {
  const win = quickCaptureWindow
  if (!win || win.isDestroyed()) return

  const bounds = win.getBounds()
  const clamped = Math.round(Math.min(QUICK_CAPTURE_MAX_HEIGHT, Math.max(QUICK_CAPTURE_HEIGHT, height)))
  if (clamped === bounds.height) return

  win.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: clamped })
})

// ── IPC: Theme ────────────────────────────────────────────────────────────────

ipcMain.handle('theme:get', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

ipcMain.handle('theme:setNative', (_, setting) => {
  nativeTheme.themeSource = setting
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

// ── IPC: App ──────────────────────────────────────────────────────────────────

ipcMain.handle('app:getInfo', () => {
  return {
    version: app.getVersion(),
    userDataPath: app.getPath('userData'),
    openAtLogin: app.getLoginItemSettings().openAtLogin,
  }
})

ipcMain.handle('app:openDataFolder', () => {
  shell.openPath(app.getPath('userData'))
  return true
})

ipcMain.handle('app:setOpenAtLogin', (_, openAtLogin) => {
  app.setLoginItemSettings({ openAtLogin })
  return app.getLoginItemSettings().openAtLogin
})

// Signals once, the first time a new version launches after updating, so the
// renderer can show its "what's new" blurb. Returns null on every other launch.
ipcMain.handle('app:getWhatsNew', () => {
  const currentVersion = app.getVersion()
  if (store.get('lastSeenVersion') === currentVersion) return null

  const pending = store.get('pendingWhatsNew')
  store.set('lastSeenVersion', currentVersion)
  store.delete('pendingWhatsNew')

  if (pending?.version === currentVersion) {
    return { version: currentVersion }
  }
  return null
})

// ── IPC: Auto-updates ────────────────────────────────────────────────────────

ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) return { status: 'dev' }
  if (updateState === 'downloading' || updateState === 'downloaded') return { status: 'ok' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { status: 'ok', version: result?.updateInfo?.version }
  } catch (err) {
    updateState = 'idle'
    return { status: 'error', message: err.message }
  }
})

ipcMain.handle('updater:download', async () => {
  if (!app.isPackaged) return { status: 'dev' }
  // Already downloading or done — don't start a second 70MB download.
  if (updateState === 'downloading' || updateState === 'downloaded') return { status: 'ok' }
  try {
    updateState = 'downloading'
    await autoUpdater.downloadUpdate()
    return { status: 'ok' }
  } catch (err) {
    updateState = 'idle'
    return { status: 'error', message: err.message }
  }
})

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall()
  return true
})
