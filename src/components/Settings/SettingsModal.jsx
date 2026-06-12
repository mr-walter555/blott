import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Palette, TextT, Keyboard, Database, Robot, ArrowsClockwise, Eye, EyeSlash } from '@phosphor-icons/react'
import { useUIStore } from '../../store/uiStore'
import { electronService } from '../../services/electronService'
import { getAIStatus } from '../../services/aiService'
import { MODAL_BACKDROP, MODAL_CONTENT } from '../../utils/motionPresets'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: TextT },
  { id: 'ai', label: 'AI', icon: Robot },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'data', label: 'Data', icon: Database },
]

const AI_STATUS_META = {
  checking:     { label: 'Checking…',         pill: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',          dot: 'bg-gray-400' },
  connected:    { label: 'Connected',         pill: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',    dot: 'bg-green-500' },
  unconfigured: { label: 'Not configured',    pill: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',    dot: 'bg-amber-500' },
  error:        { label: 'Backend unreachable', pill: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',          dot: 'bg-red-500' },
}

const SHORTCUTS = [
  { keys: 'Ctrl+N', action: 'New note' },
  { keys: 'Ctrl+S', action: 'Save note' },
  { keys: 'Ctrl+F', action: 'Search notes' },
  { keys: 'Ctrl+Shift+A', action: 'Ask your notes' },
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

export default function SettingsModal() {
  const closeSettings = useUIStore(s => s.closeSettings)
  const theme = useUIStore(s => s.theme)
  const setTheme = useUIStore(s => s.setTheme)
  const resolvedTheme = useUIStore(s => s.resolvedTheme)
  const fontSize = useUIStore(s => s.fontSize)
  const setFontSize = useUIStore(s => s.setFontSize)
  const autoSaveInterval = useUIStore(s => s.autoSaveInterval)
  const setAutoSaveInterval = useUIStore(s => s.setAutoSaveInterval)

  const [activeSection, setActiveSection] = useState('appearance')
  const [aiStatus, setAiStatus] = useState(null)
  const [encryptionStatus, setEncryptionStatus] = useState(null)
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
      window.electronAPI.settings.get().then(s => setApiKey(s.openRouterApiKey || ''))
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

  const handleSave = async () => {
    // Read fresh from the store rather than the render closure — handleSave is
    // invoked in the same tick as setTheme/setFontSize/setAutoSaveInterval,
    // before React re-renders with the new value, so `theme` etc. here would
    // otherwise still be the previous selection.
    const { theme, fontSize, autoSaveInterval } = useUIStore.getState()
    const settings = { theme, fontSize, autoSaveInterval }
    if (electronService.isElectron) {
      await window.electronAPI.settings.set(settings)
    } else {
      localStorage.setItem('sn_settings', JSON.stringify(settings))
    }
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
        className="pointer-events-auto w-full max-w-2xl h-[min(75vh,600px)] flex flex-col"
      >
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <h2 id="settings-modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
            <button onClick={closeSettings} className="btn-icon">
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-44 border-r border-gray-100 dark:border-gray-800 py-2 flex-shrink-0">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeSection === id
                      ? 'text-brown-600 dark:text-brown-400 bg-brown-50 dark:bg-brown-950/40'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {activeSection === 'appearance' && (
                <>
                  <SettingRow
                    label="Theme"
                    description={
                      theme === 'system'
                        ? `Following system — currently ${resolvedTheme}`
                        : 'Choose light, dark, or follow system'
                    }
                  >
                    <div className="flex gap-2">
                      {['light', 'system', 'dark'].map(t => (
                        <button
                          key={t}
                          onClick={() => { setTheme(t); handleSave() }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                            theme === t
                              ? 'bg-brown-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                </>
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
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {s}
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
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                    <SettingRow label="OpenRouter API Key" description="Powers Ask AI and writing tools. Get a free key at openrouter.ai/keys">
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

              {activeSection === 'shortcuts' && (
                <div className="space-y-1">
                  {SHORTCUTS.map(({ keys, action }) => (
                    <div key={keys} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{action}</span>
                      <kbd className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
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
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}