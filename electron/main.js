const { app, BrowserWindow, ipcMain, nativeTheme, Menu, shell, nativeImage, session } = require('electron')
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
      floatingOpacity: 95,
    },
  },
})

let mainWindow = null
const floatingWindows = new Map()

function sendUpdateStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', { status, ...data })
  }
}

// electron-updater returns either a markdown string or, when skipping
// multiple versions, an array of per-version { version, note } entries.
function formatReleaseNotes(releaseNotes) {
  if (typeof releaseNotes === 'string') return releaseNotes
  if (Array.isArray(releaseNotes)) return releaseNotes.map(n => n.note).filter(Boolean).join('\n')
  return null
}

autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'))
autoUpdater.on('update-available', (info) => sendUpdateStatus('available', { version: info.version }))
autoUpdater.on('update-not-available', () => sendUpdateStatus('not-available'))
autoUpdater.on('error', (err) => sendUpdateStatus('error', { message: err?.message || String(err) }))
autoUpdater.on('download-progress', (progress) => sendUpdateStatus('downloading', { percent: progress.percent }))
autoUpdater.on('update-downloaded', (info) => {
  const notes = formatReleaseNotes(info.releaseNotes)
  if (notes) store.set('pendingWhatsNew', { version: info.version, notes })
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
    floatingWindows.forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('theme:changed', theme)
    })
  })

  Menu.setApplicationMenu(null)
}

function createFloatingWindow(noteId) {
  if (floatingWindows.has(noteId)) {
    const existing = floatingWindows.get(noteId)
    if (!existing.isDestroyed()) {
      existing.focus()
      return
    }
  }

  const floatWin = new BrowserWindow({
    width: 320,
    height: 260,
    minWidth: 220,
    minHeight: 160,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    skipTaskbar: false,
    hasShadow: true,
  })

  if (isDev) {
    floatWin.loadURL(`http://localhost:5173/?mode=sticky&noteId=${noteId}`)
  } else {
    floatWin.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { mode: 'sticky', noteId },
    })
  }

  floatingWindows.set(noteId, floatWin)

  floatWin.on('closed', () => {
    floatingWindows.delete(noteId)
  })
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

  // Silent check on launch so the About settings page can show update
  // status without the user needing to click "Check for Updates" first.
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Notes ────────────────────────────────────────────────────────────────

ipcMain.handle('notes:getAll', () => {
  return Object.values(store.get('notes', {})).map(decryptNote)
})

ipcMain.handle('notes:create', (_, data) => {
  const now = new Date().toISOString()
  const note = {
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
    ...data,
  }
  store.set(`notes.${note.id}`, encryptNote(note))
  return note
})

ipcMain.handle('notes:update', (_, id, updates) => {
  const notes = store.get('notes', {})
  if (!notes[id]) return null
  const existing = decryptNote(notes[id])
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  store.set(`notes.${id}`, encryptNote(updated))
  floatingWindows.forEach((win, noteId) => {
    if (noteId === id && !win.isDestroyed()) {
      win.webContents.send('note:updated', updated)
    }
  })
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

// ── IPC: Floating Notes ───────────────────────────────────────────────────────

ipcMain.handle('floating:open', (_, noteId) => {
  createFloatingWindow(noteId)
  return true
})

ipcMain.handle('floating:close', (_, noteId) => {
  const win = floatingWindows.get(noteId)
  if (win && !win.isDestroyed()) win.close()
  return true
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

// Returns release notes once, the first time a new version launches after
// updating. Returns null on every other launch.
ipcMain.handle('app:getWhatsNew', () => {
  const currentVersion = app.getVersion()
  if (store.get('lastSeenVersion') === currentVersion) return null

  const pending = store.get('pendingWhatsNew')
  store.set('lastSeenVersion', currentVersion)
  store.delete('pendingWhatsNew')

  if (pending?.version === currentVersion && pending.notes) {
    return { version: currentVersion, notes: pending.notes }
  }
  return null
})

// ── IPC: Auto-updates ────────────────────────────────────────────────────────

ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) return { status: 'dev' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { status: 'ok', version: result?.updateInfo?.version }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
})

ipcMain.handle('updater:download', async () => {
  if (!app.isPackaged) return { status: 'dev' }
  try {
    await autoUpdater.downloadUpdate()
    return { status: 'ok' }
  } catch (err) {
    return { status: 'error', message: err.message }
  }
})

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall()
  return true
})
