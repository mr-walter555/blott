import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Palette, TextT, Keyboard, Database, Robot, ArrowsClockwise, Eye, EyeSlash, DownloadSimple, Info, FolderOpen, PlugsConnected, Sun, Moon, Monitor } from '@phosphor-icons/react'
import { useUIStore, FONT_FAMILIES } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import { electronService } from '../../services/electronService'
import { getAIStatus } from '../../services/aiService'
import { MODAL_BACKDROP, MODAL_CONTENT } from '../../utils/motionPresets'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: TextT },
  { id: 'ai', label: 'AI', icon: Robot },
  { id: 'integrations', label: 'Integrations', icon: PlugsConnected },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'about', label: 'About', icon: Info },
]

const INTEGRATIONS = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Sync and back up your notes automatically to Google Drive.',
    logo: '🔵',
    status: 'coming-soon',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Import pages from Notion or export notes as Notion pages.',
    logo: '⬛',
    status: 'coming-soon',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notes or snippets directly to a Slack channel.',
    logo: '💬',
    status: 'coming-soon',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect Blott to 6,000+ apps via Zapier webhooks.',
    logo: '⚡',
    status: 'coming-soon',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Attach notes to calendar events and see upcoming tasks.',
    logo: '📅',
    status: 'coming-soon',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Save notes as Gists or link notes to issues and pull requests.',
    logo: '🐙',
    status: 'coming-soon',
  },
]

const AI_STATUS_META = {
  checking:     { label: 'Checking…',         pill: 'bg-gray-100 dark:bg-gray-800 text-muted',          dot: 'bg-gray-400' },
  connected:    { label: 'Connected',         pill: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',    dot: 'bg-green-500' },
  unconfigured: { label: 'Not configured',    pill: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',    dot: 'bg-amber-500' },
  error:        { label: 'Backend unreachable', pill: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',          dot: 'bg-red-500' },
}

const UPDATE_STATUS_META = {
  checking:       { label: 'Checking…',       pill: 'bg-gray-100 dark:bg-gray-800 text-muted',       dot: 'bg-gray-400' },
  'not-available': { label: 'Up to date',     pill: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  available:      { label: 'Update available', pill: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  downloading:    { label: 'Downloading…',     pill: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  downloaded:     { label: 'Ready to install', pill: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  error:          { label: 'Check failed',     pill: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',        dot: 'bg-red-500' },
  dev:            { label: 'Dev build',        pill: 'bg-gray-100 dark:bg-gray-800 text-muted',      dot: 'bg-gray-400' },
}

const SHORTCUTS = [
  { keys: 'Alt+Space', action: 'Quick capture (works anywhere)' },
  { keys: 'Ctrl+N', action: 'New note' },
  { keys: 'Ctrl+S', action: 'Save note' },
  { keys: 'Ctrl+F', action: 'Search notes' },
  { keys: 'Ctrl+Q', action: 'Ask your notes' },
  { keys: 'Ctrl+Shift+P', action: 'Command palette' },
  { keys: 'Ctrl+,', action: 'Open settings' },
  { keys: 'Ctrl+B', action: 'Bold' },
  { keys: 'Ctrl+I', action: 'Italic' },
  { keys: 'Ctrl+U', action: 'Underline' },
  { keys: 'Ctrl+Shift+L', action: 'Align left' },
  { keys: 'Ctrl+Shift+E', action: 'Align center' },
  { keys: 'Ctrl+Shift+R', action: 'Align right' },
  { keys: 'Ctrl+Shift+J', action: 'Justify' },
  { keys: 'Ctrl+Z', action: 'Undo' },
  { keys: 'Ctrl+Shift+Z', action: 'Redo' },
  { keys: 'Esc', action: 'Close modal/palette' },
]

function LightPreview() {
  return (
    <svg viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
      <rect width="220" height="130" fill="#f9fafb"/>
      <rect width="58" height="130" fill="#f3f4f6"/>
      <circle cx="9"  cy="8" r="3" fill="#ff5f57"/><circle cx="18" cy="8" r="3" fill="#ffbd2e"/><circle cx="27" cy="8" r="3" fill="#28c840"/>
      <rect x="5" y="18" width="48" height="13" rx="4" fill="#e5e7eb"/><rect x="9" y="21" width="30" height="4" rx="2" fill="#9ca3af"/><rect x="9" y="28" width="20" height="3" rx="1.5" fill="#d1d5db"/>
      <rect x="5" y="35" width="48" height="13" rx="4" fill="#fff"/><rect x="9" y="38" width="26" height="4" rx="2" fill="#d1d5db"/><rect x="9" y="45" width="17" height="3" rx="1.5" fill="#e5e7eb"/>
      <rect x="5" y="52" width="48" height="13" rx="4" fill="#fff"/><rect x="9" y="55" width="32" height="4" rx="2" fill="#d1d5db"/><rect x="9" y="62" width="22" height="3" rx="1.5" fill="#e5e7eb"/>
      <rect x="58" y="0" width="162" height="130" fill="#fff"/>
      <rect x="58" y="0"  width="162" height="15" fill="#f9fafb"/>
      <rect x="58" y="14" width="162" height="1"  fill="#f3f4f6"/>
      <rect x="68" y="23" width="72" height="8" rx="3" fill="#111827"/>
      <rect x="68" y="37" width="122" height="5" rx="2" fill="#e5e7eb"/>
      <rect x="68" y="46" width="102" height="5" rx="2" fill="#e5e7eb"/>
      <rect x="68" y="55" width="112" height="5" rx="2" fill="#e5e7eb"/>
      <rect x="68" y="64" width="88"  height="5" rx="2" fill="#e5e7eb"/>
      <rect x="68" y="78" width="118" height="5" rx="2" fill="#e5e7eb"/>
      <rect x="68" y="87" width="96"  height="5" rx="2" fill="#e5e7eb"/>
    </svg>
  )
}

function DarkPreview() {
  return (
    <svg viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
      <rect width="220" height="130" fill="#0f172a"/>
      <rect width="58" height="130" fill="#1e293b"/>
      <circle cx="9"  cy="8" r="3" fill="#ff5f57"/><circle cx="18" cy="8" r="3" fill="#ffbd2e"/><circle cx="27" cy="8" r="3" fill="#28c840"/>
      <rect x="5" y="18" width="48" height="13" rx="4" fill="#334155"/><rect x="9" y="21" width="30" height="4" rx="2" fill="#64748b"/><rect x="9" y="28" width="20" height="3" rx="1.5" fill="#475569"/>
      <rect x="5" y="35" width="48" height="13" rx="4" fill="#1e293b"/><rect x="9" y="38" width="26" height="4" rx="2" fill="#475569"/><rect x="9" y="45" width="17" height="3" rx="1.5" fill="#334155"/>
      <rect x="5" y="52" width="48" height="13" rx="4" fill="#1e293b"/><rect x="9" y="55" width="32" height="4" rx="2" fill="#475569"/><rect x="9" y="62" width="22" height="3" rx="1.5" fill="#334155"/>
      <rect x="58" y="0" width="162" height="130" fill="#0f172a"/>
      <rect x="58" y="0"  width="162" height="15" fill="#1e293b"/>
      <rect x="58" y="14" width="162" height="1"  fill="#334155"/>
      <rect x="68" y="23" width="72" height="8" rx="3" fill="#f1f5f9"/>
      <rect x="68" y="37" width="122" height="5" rx="2" fill="#334155"/>
      <rect x="68" y="46" width="102" height="5" rx="2" fill="#334155"/>
      <rect x="68" y="55" width="112" height="5" rx="2" fill="#334155"/>
      <rect x="68" y="64" width="88"  height="5" rx="2" fill="#334155"/>
      <rect x="68" y="78" width="118" height="5" rx="2" fill="#334155"/>
      <rect x="68" y="87" width="96"  height="5" rx="2" fill="#334155"/>
    </svg>
  )
}

function SystemPreview() {
  return (
    <svg viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
      {/* Left half — light */}
      <rect width="109" height="130" fill="#f9fafb"/>
      <rect width="38" height="130" fill="#f3f4f6"/>
      <circle cx="7"  cy="8" r="2.5" fill="#ff5f57"/><circle cx="14" cy="8" r="2.5" fill="#ffbd2e"/><circle cx="21" cy="8" r="2.5" fill="#28c840"/>
      <rect x="3" y="18" width="32" height="10" rx="3" fill="#e5e7eb"/>
      <rect x="3" y="32" width="32" height="10" rx="3" fill="#fff"/>
      <rect x="3" y="46" width="32" height="10" rx="3" fill="#fff"/>
      <rect x="38" y="0" width="71" height="130" fill="#fff"/>
      <rect x="38" y="0" width="71" height="14" fill="#f9fafb"/>
      <rect x="44" y="20" width="48" height="6" rx="2" fill="#111827"/>
      <rect x="44" y="31" width="56" height="4" rx="1.5" fill="#e5e7eb"/>
      <rect x="44" y="39" width="44" height="4" rx="1.5" fill="#e5e7eb"/>
      <rect x="44" y="47" width="52" height="4" rx="1.5" fill="#e5e7eb"/>
      {/* Divider */}
      <rect x="108" y="0" width="2" height="130" fill="#cbd5e1"/>
      {/* Right half — dark */}
      <rect x="110" width="110" height="130" fill="#0f172a"/>
      <rect x="110" width="38"  height="130" fill="#1e293b"/>
      <rect x="113" y="18" width="32" height="10" rx="3" fill="#334155"/>
      <rect x="113" y="32" width="32" height="10" rx="3" fill="#1e293b"/>
      <rect x="113" y="46" width="32" height="10" rx="3" fill="#1e293b"/>
      <rect x="148" y="0"  width="72" height="130" fill="#0f172a"/>
      <rect x="148" y="0"  width="72" height="14" fill="#1e293b"/>
      <rect x="154" y="20" width="48" height="6" rx="2" fill="#f1f5f9"/>
      <rect x="154" y="31" width="56" height="4" rx="1.5" fill="#334155"/>
      <rect x="154" y="39" width="44" height="4" rx="1.5" fill="#334155"/>
      <rect x="154" y="47" width="52" height="4" rx="1.5" fill="#334155"/>
    </svg>
  )
}

const THEME_CARDS = [
  {
    id: 'light',
    label: 'Light theme',
    description: 'This theme will activate when your system is set to light mode',
    previewLabel: 'Default light',
    Icon: Sun,
    Preview: LightPreview,
  },
  {
    id: 'dark',
    label: 'Dark theme',
    description: 'This theme will activate when your system is set to dark mode',
    previewLabel: 'Default dark',
    Icon: Moon,
    Preview: DarkPreview,
  },
  {
    id: 'system',
    label: 'System',
    description: 'Uses your system preference and switches automatically',
    previewLabel: 'Default system',
    Icon: Monitor,
    Preview: SystemPreview,
  },
]

export default function SettingsModal() {
  const closeSettings = useUIStore(s => s.closeSettings)
  const theme = useUIStore(s => s.theme)
  const setTheme = useUIStore(s => s.setTheme)
  const resolvedTheme = useUIStore(s => s.resolvedTheme)
  const fontSize = useUIStore(s => s.fontSize)
  const setFontSize = useUIStore(s => s.setFontSize)
  const fontFamily = useUIStore(s => s.fontFamily)
  const setFontFamily = useUIStore(s => s.setFontFamily)
  const autoSaveInterval = useUIStore(s => s.autoSaveInterval)
  const setAutoSaveInterval = useUIStore(s => s.setAutoSaveInterval)

  const [activeSection, setActiveSection] = useState('appearance')
  const [aiStatus, setAiStatus] = useState(null)
  const [encryptionStatus, setEncryptionStatus] = useState(null)
  const [appInfo, setAppInfo] = useState(null)
  const [openAtLogin, setOpenAtLoginState] = useState(false)
  const [openAtLoginSaving, setOpenAtLoginSaving] = useState(false)
  const [startMinimized, setStartMinimized] = useState(false)
  const updateStatus = useUIStore(s => s.updateStatus)
  const setUpdateStatus = useUIStore(s => s.setUpdateStatus)
  const [apiKey, setApiKey] = useState('')
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const dialogRef = useFocusTrap()

  const checkAIStatus = async () => {
    setAiStatus('checking')
    try {
      const { configured } = await getAIStatus()
      setAiStatus(configured ? 'connected' : 'unconfigured')
    } catch {
      setAiStatus('error')
    }
  }

  useEffect(() => {
    if (activeSection === 'ai' && aiStatus === null) checkAIStatus()
  }, [activeSection])

  useEffect(() => {
    if (electronService.isElectron) {
      window.electronAPI.settings.get().then(s => {
        setApiKey(s.openRouterApiKey || '')
        setStartMinimized(!!s.startMinimized)
      })
    }
  }, [])

  const saveApiKey = async () => {
    await window.electronAPI.settings.set({ openRouterApiKey: apiKey.trim() })
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
    // The backend restarts to pick up the new key — give it a moment before rechecking.
    setAiStatus('checking')
    setTimeout(checkAIStatus, 1500)
  }

  useEffect(() => {
    if (activeSection === 'data' && encryptionStatus === null && electronService.isElectron) {
      window.electronAPI.encryption.getStatus().then(setEncryptionStatus)
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection === 'about' && appInfo === null && electronService.isElectron) {
      window.electronAPI.app.getInfo().then(info => {
        setAppInfo(info)
        setOpenAtLoginState(info.openAtLogin)
      })
    }
  }, [activeSection])

  const toggleOpenAtLogin = async () => {
    const next = !openAtLogin
    setOpenAtLoginState(next)
    setOpenAtLoginSaving(true)
    await window.electronAPI.app.setOpenAtLogin(next)
    setOpenAtLoginSaving(false)
  }

  const toggleStartMinimized = async () => {
    const next = !startMinimized
    setStartMinimized(next)
    await window.electronAPI.settings.set({ startMinimized: next })
  }

  const openDataFolder = () => window.electronAPI.app.openDataFolder()

  const checkForUpdates = async () => {
    setUpdateStatus({ status: 'checking' })
    const result = await window.electronAPI.updater.check()
    if (result.status === 'dev') setUpdateStatus({ status: 'dev' })
    else if (result.status === 'error') setUpdateStatus({ status: 'error', message: result.message })
  }

  const downloadUpdate = () => {
    setUpdateStatus(s => ({ ...s, status: 'downloading', percent: 0 }))
    window.electronAPI.updater.download()
  }

  const installUpdate = () => window.electronAPI.updater.install()

  const handleSave = async () => {
    // Read fresh from the store rather than the render closure — handleSave is
    // invoked in the same tick as setTheme/setFontSize/setAutoSaveInterval,
    // before React re-renders with the new value, so `theme` etc. here would
    // otherwise still be the previous selection.
    const { theme, fontSize, fontFamily, autoSaveInterval } = useUIStore.getState()
    const settings = { theme, fontSize, fontFamily, autoSaveInterval }
    if (electronService.isElectron) {
      await window.electronAPI.settings.set(settings)
    } else {
      localStorage.setItem('sn_settings', JSON.stringify(settings))
    }
  }

  const handleExportAll = () => {
    const notes = Object.values(useNotesStore.getState().notes)
    const payload = {
      app: 'Blott',
      version: 1,
      exportedAt: new Date().toISOString(),
      notes,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Blott-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <motion.div
        {...MODAL_BACKDROP}
        onClick={closeSettings}
        className="fixed inset-0 z-50 bg-black/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        {...MODAL_CONTENT}
        className="pointer-events-auto w-full max-w-2xl h-[min(80vh,680px)] flex flex-col"
      >
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <h2 id="settings-modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
            <button onClick={closeSettings} className="btn-icon">
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-44 border-r border-gray-100 dark:border-gray-800 py-3 flex-shrink-0">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    activeSection === id
                      ? 'text-brown-600 dark:text-brown-400 bg-brown-50 dark:bg-brown-950/40'
                      : 'text-gray-600 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">
              {activeSection === 'appearance' && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Theme</p>
                  <p className="text-xs text-muted mb-5">Choose how Blott looks on your device</p>
                  <div className="grid grid-cols-2 gap-5">
                    {THEME_CARDS.map(({ id, label, description, previewLabel, Icon, Preview }) => {
                      const active = theme === id
                      const isSystem = id === 'system'
                      return (
                        <button
                          key={id}
                          onClick={() => { setTheme(id); handleSave() }}
                          className={`text-left rounded-xl border-2 p-5 transition-all ${isSystem ? 'col-span-2' : ''} ${
                            active
                              ? 'border-brown-600 dark:border-brown-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {isSystem ? (
                            <div className="flex items-center gap-6">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</span>
                                  {active && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brown-600 text-white ml-1">Active</span>}
                                </div>
                                <p className="text-xs text-muted mb-3 leading-relaxed">{description}</p>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{previewLabel}</p>
                              </div>
                              <div className="w-48 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <Preview />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{label}</span>
                                </div>
                                {active && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brown-600 text-white flex-shrink-0 ml-1">Active</span>}
                              </div>
                              <p className="text-xs text-muted mb-4 leading-relaxed">{description}</p>
                              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-3">
                                <Preview />
                              </div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{previewLabel}</p>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeSection === 'editor' && (
                <>
                  <SettingRow label="Font Size" description="Text size in the editor">
                    <div className="flex gap-2">
                      {['small', 'medium', 'large'].map(s => (
                        <button
                          key={s}
                          onClick={() => { setFontSize(s); handleSave() }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                            fontSize === s
                              ? 'bg-brown-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </SettingRow>

                  <SettingRow label="Font Family" description="Typeface used in the editor">
                    <div className="flex gap-2">
                      {Object.entries(FONT_FAMILIES).map(([id, { label, value }]) => (
                        <button
                          key={id}
                          onClick={() => { setFontFamily(id); handleSave() }}
                          style={{ fontFamily: value }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            fontFamily === id
                              ? 'bg-brown-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </SettingRow>

                  <SettingRow label="Auto-save Delay" description="How long to wait before auto-saving">
                    <div className="flex gap-2">
                      {[{ label: '1s', value: 1000 }, { label: '2s', value: 2000 }, { label: '5s', value: 5000 }].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setAutoSaveInterval(opt.value); handleSave() }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            autoSaveInterval === opt.value
                              ? 'bg-brown-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                </>
              )}

              {activeSection === 'ai' && (
                <>
                  {electronService.isElectron && (
                    <SettingRow label="OpenRouter API Key" description="Powers Ask AI and writing tools. Get a free key at openrouter.ai/keys" stacked>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={apiKeyVisible ? 'text' : 'password'}
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full text-sm pl-3 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-500/20 text-gray-900 dark:text-gray-100 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setApiKeyVisible(v => !v)}
                            aria-label={apiKeyVisible ? 'Hide API key' : 'Show API key'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-gray-600 dark:hover:text-muted"
                          >
                            {apiKeyVisible ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          onClick={saveApiKey}
                          className="px-4 py-2 text-sm font-medium bg-brown-600 hover:bg-brown-700 text-white rounded-lg transition-colors flex-shrink-0"
                        >
                          {apiKeySaved ? '✓ Saved' : 'Save'}
                        </button>
                      </div>
                    </SettingRow>
                  )}

                  <SettingRow label="AI Connection" description="Status of the AI backend used for Ask AI and writing tools">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${(AI_STATUS_META[aiStatus] ?? AI_STATUS_META.checking).pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${(AI_STATUS_META[aiStatus] ?? AI_STATUS_META.checking).dot}`} />
                        {(AI_STATUS_META[aiStatus] ?? AI_STATUS_META.checking).label}
                      </span>
                      <button
                        onClick={checkAIStatus}
                        disabled={aiStatus === 'checking'}
                        className="flex items-center gap-1 text-xs font-medium text-brown-600 dark:text-brown-400 hover:text-brown-700 dark:hover:text-brown-300 disabled:opacity-50 transition-colors"
                      >
                        <ArrowsClockwise className={`w-3.5 h-3.5 ${aiStatus === 'checking' ? 'animate-spin' : ''}`} />
                        Recheck
                      </button>
                    </div>
                  </SettingRow>

                  {aiStatus !== 'connected' && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">Setup Instructions</p>
                      {electronService.isElectron ? (
                        <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                          <li>Get a free API key at <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">openrouter.ai/keys</code></li>
                          <li>Paste it into the "OpenRouter API Key" field above and click Save</li>
                          <li>Click "Recheck" above</li>
                        </ol>
                      ) : (
                        <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                          <li>Copy <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env.example</code> to <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env</code> in the backend folder</li>
                          <li>Add your OpenRouter API key as <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">OPENROUTER_API_KEY</code> in the .env file</li>
                          <li>Run <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">npm run dev:backend</code> in a terminal</li>
                          <li>Click "Recheck" above</li>
                        </ol>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeSection === 'integrations' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted">Connect Blott with your favourite tools. More integrations coming soon.</p>
                  <div className="grid grid-cols-1 gap-3">
                    {INTEGRATIONS.map(({ id, name, description, logo, status }) => (
                      <div key={id} className="flex items-center gap-4 p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                        <span className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">{logo}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
                          <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
                        </div>
                        {status === 'coming-soon' ? (
                          <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-muted">
                            Coming soon
                          </span>
                        ) : (
                          <button className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-brown-600 hover:bg-brown-700 text-white transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'shortcuts' && (
                <div>
                  {SHORTCUTS.map(({ keys, action }) => (
                    <div key={keys} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-muted">{action}</span>
                      <kbd className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted px-2.5 py-1 rounded-lg">
                        {keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'data' && (
                <>
                  <SettingRow
                    label="Storage"
                    description={electronService.isElectron
                      ? 'Notes are saved locally on your device (Electron Store, AppData)'
                      : 'Notes are saved locally in your browser (LocalStorage)'}
                  >
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Active (offline-first)</div>
                  </SettingRow>

                  <SettingRow label="Export Notes" description="Download a backup of every note as a single JSON file">
                    <button
                      onClick={handleExportAll}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <DownloadSimple className="w-4 h-4" />
                      Export All Notes
                    </button>
                  </SettingRow>

                  {electronService.isElectron && (
                    <SettingRow
                      label="Encryption"
                      description={encryptionStatus?.osProtected === false
                        ? 'Note titles and content are encrypted at rest with AES-256-GCM. The encryption key is currently not protected by your OS keychain.'
                        : 'Note titles and content are encrypted at rest with AES-256-GCM. The encryption key is protected by your operating system (Windows Credential Store / Keychain).'}
                    >
                      {encryptionStatus?.osProtected === false ? (
                        <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">⚠ Key not OS-protected</div>
                      ) : (
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Enabled (AES-256-GCM)</div>
                      )}
                    </SettingRow>
                  )}
                </>
              )}

              {activeSection === 'about' && (
                <>
                  <SettingRow label="Version" description="Blott">
                    <span className="text-sm text-gray-600 dark:text-muted font-mono">
                      {electronService.isElectron ? (appInfo?.version ? `v${appInfo.version}` : 'Loading…') : 'Browser'}
                    </span>
                  </SettingRow>

                  {electronService.isElectron && (
                    <>
                      <SettingRow label="Updates" description="Blott checks for new versions on launch">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${(UPDATE_STATUS_META[updateStatus?.status] ?? UPDATE_STATUS_META.checking).pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${(UPDATE_STATUS_META[updateStatus?.status] ?? UPDATE_STATUS_META.checking).dot}`} />
                            {updateStatus?.status === 'available' && updateStatus.version
                              ? `Update available — v${updateStatus.version}`
                              : updateStatus?.status === 'downloading'
                                ? `Downloading… ${Math.round(updateStatus.percent || 0)}%`
                                : updateStatus?.status === 'downloaded' && updateStatus.version
                                  ? `Ready to install — v${updateStatus.version}`
                                  : (UPDATE_STATUS_META[updateStatus?.status] ?? UPDATE_STATUS_META.checking).label}
                          </span>

                          {updateStatus?.status === 'available' && (
                            <button
                              onClick={downloadUpdate}
                              className="flex items-center gap-1 text-xs font-medium text-brown-600 dark:text-brown-400 hover:text-brown-700 dark:hover:text-brown-300 transition-colors"
                            >
                              <DownloadSimple className="w-3.5 h-3.5" />
                              Download
                            </button>
                          )}

                          {updateStatus?.status === 'downloaded' && (
                            <button
                              onClick={installUpdate}
                              className="flex items-center gap-1 text-xs font-medium text-brown-600 dark:text-brown-400 hover:text-brown-700 dark:hover:text-brown-300 transition-colors"
                            >
                              Restart &amp; Install
                            </button>
                          )}

                          {!['downloading', 'downloaded'].includes(updateStatus?.status) && (
                            <button
                              onClick={checkForUpdates}
                              disabled={updateStatus?.status === 'checking' || updateStatus?.status === 'dev'}
                              className="flex items-center gap-1 text-xs font-medium text-brown-600 dark:text-brown-400 hover:text-brown-700 dark:hover:text-brown-300 disabled:opacity-50 transition-colors"
                            >
                              <ArrowsClockwise className={`w-3.5 h-3.5 ${updateStatus?.status === 'checking' ? 'animate-spin' : ''}`} />
                              Check for Updates
                            </button>
                          )}
                        </div>
                      </SettingRow>

                      <SettingRow label="Launch at Startup" description="Automatically open Blott when you log in">
                        <Toggle checked={openAtLogin} onChange={toggleOpenAtLogin} disabled={openAtLoginSaving} />
                      </SettingRow>

                      <SettingRow label="Start Minimized" description="Open directly to the tray instead of showing the window">
                        <Toggle checked={startMinimized} onChange={toggleStartMinimized} disabled={!openAtLogin} />
                      </SettingRow>

                      <SettingRow label="Data Folder" description="Where your encrypted notes are stored on disk">
                        <button
                          onClick={openDataFolder}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-muted hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Open Folder
                        </button>
                      </SettingRow>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  )
}

function SettingRow({ label, description, children, stacked }) {
  return (
    <div className={`pb-8 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0 ${stacked ? 'space-y-3' : 'flex items-start justify-between gap-8'}`}>
      <div className={stacked ? '' : 'flex-1'}>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className={stacked ? '' : 'flex-shrink-0 pt-0.5'}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-brown-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}