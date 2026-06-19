import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'
import { electronService } from '../services/electronService'

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function resolveTheme(theme) {
  if (theme === 'system') return media?.matches ? 'dark' : 'light'
  return theme
}

export function useTheme() {
  const theme = useUIStore(s => s.theme)
  const setResolvedTheme = useUIStore(s => s.setResolvedTheme)
  const applySettings = useUIStore(s => s.applySettings)

  // Load the persisted theme choice once on mount — settings live in
  // electron-store inside the Monitor app, localStorage in the browser
  // (mirrors the two branches SettingsModal.handleSave writes to)
  useEffect(() => {
    if (electronService.isElectron) {
      window.electronAPI.settings.get().then(settings => {
        applySettings(settings)
      }).catch(() => {})
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('sn_settings') || 'null')
        if (stored) applySettings(stored)
      } catch {}
    }
  }, [])

  // Apply the resolved theme to the document and keep it in sync with OS
  // preference changes whenever the user has chosen "system"
  useEffect(() => {
    const sync = () => {
      const resolved = resolveTheme(theme)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      setResolvedTheme(resolved)
    }
    sync()

    if (theme !== 'system') return undefined

    media?.addEventListener('change', sync)
    const unsubscribeIpc = electronService.isElectron ? window.electronAPI.theme.onChange(sync) : null
    return () => {
      media?.removeEventListener('change', sync)
      unsubscribeIpc?.()
    }
  }, [theme, setResolvedTheme])

  // Mirror the choice to Electron's native theme so window chrome (titlebar,
  // menus) matches the in-app appearance
  useEffect(() => {
    if (!electronService.isElectron) return
    window.electronAPI.theme.setNative(theme).catch(() => {})
  }, [theme])
}
