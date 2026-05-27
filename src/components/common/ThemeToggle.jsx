import { Sun, Moon, Desktop } from '@phosphor-icons/react'
import { useUIStore } from '../../store/uiStore'

const THEMES = [
  { id: 'light', icon: Sun },
  { id: 'system', icon: Desktop },
  { id: 'dark', icon: Moon },
]

export default function ThemeToggle() {
  const theme = useUIStore(s => s.theme)
  const setTheme = useUIStore(s => s.setTheme)

  const current = THEMES.find(t => t.id === theme) || THEMES[1]
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]

  return (
    <button
      onClick={() => setTheme(next.id)}
      className="btn-icon"
      title={`Theme: ${theme} (click to cycle)`}
    >
      <current.icon className="w-5 h-5 text-black dark:text-white" />
    </button>
  )
}