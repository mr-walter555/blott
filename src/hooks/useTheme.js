import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'
import { electronService } from '../services/electronService'

export function useTheme() {
  const { applySettings } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.remove('dark')

    if (electronService.isElectron) {
      window.electronAPI.settings.get().then(settings => {
        applySettings(settings)
      }).catch(() => {})
    }
  }, [])
}
