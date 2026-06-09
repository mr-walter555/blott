import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Palette, TextT, Keyboard, Database, Robot, User } from '@phosphor-icons/react'
import { useUIStore } from '../../store/uiStore'
import { electronService } from '../../services/electronService'
import { gravatarUrl } from '../../utils/gravatar'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: TextT },
  { id: 'ai', label: 'AI', icon: Robot },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'data', label: 'Data', icon: Database },
]

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

  const [activeSection, setActiveSection] = useState('profile')
  const [profileName, setProfileName] = useState(() => localStorage.getItem('sn_user_name') || '')
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('sn_user_email') || '')
  const [profileSaved, setProfileSaved] = useState(false)

  const saveProfile = () => {
    localStorage.setItem('sn_user_name', profileName.trim())
    localStorage.setItem('sn_user_email', profileEmail.trim().toLowerCase())
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeSettings}
        className="fixed inset-0 z-50 bg-black/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
        className="pointer-events-auto w-full max-w-2xl h-[75vh] flex flex-col"
      >
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
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
                  <Icon className="w-5 h-5 text-black dark:text-white" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {activeSection === 'profile' && (
                <>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-brown-100 flex-shrink-0 flex items-center justify-center">
                      {profileEmail
                        ? <img src={gravatarUrl(profileEmail, 56)} alt="avatar" className="w-full h-full object-cover" onError={e => { e.target.style.display='none' }} />
                        : <span className="text-xl font-semibold text-brown-600">{(profileName || '?')[0].toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{profileName || 'Your Name'}</p>
                      <p className="text-xs text-gray-400">{profileEmail || 'your@email.com'}</p>
                    </div>
                  </div>
                  <SettingRow label="Display Name" description="Shown when you share notes with others">
                    <input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Your name"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-500/20 text-gray-900 dark:text-gray-100"
                    />
                  </SettingRow>
                  <SettingRow label="Email" description="Used for your avatar (Gravatar) in shared notes">
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-500/20 text-gray-900 dark:text-gray-100"
                    />
                  </SettingRow>
                  <button
                    onClick={saveProfile}
                    className="px-4 py-2 text-sm font-medium bg-brown-600 hover:bg-brown-700 text-white rounded-lg transition-colors"
                  >
                    {profileSaved ? '✓ Saved' : 'Save Profile'}
                  </button>
                </>
              )}

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
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">Setup Instructions</p>
                  <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                    <li>Copy <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env.example</code> to <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env</code> in the backend folder</li>
                    <li>Add your OpenRouter API key as <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">OPENROUTER_API_KEY</code> in the .env file</li>
                    <li>Run <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">npm run dev:backend</code> in a terminal</li>
                    <li>AI features will work automatically</li>
                  </ol>
                </div>
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
                  <SettingRow label="Local Storage" description="Notes are saved locally on your device">
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Active (offline-first)</div>
                  </SettingRow>
                  <SettingRow label="Cloud Sync" description="Sync notes to MongoDB (requires setup)">
                    <div className="text-sm text-gray-400">Coming soon</div>
                  </SettingRow>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">Storage Location</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      {electronService.isElectron
                        ? 'Notes stored in Electron Store (AppData/electron-store)'
                        : 'Notes stored in browser LocalStorage'}
                    </p>
                  </div>
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