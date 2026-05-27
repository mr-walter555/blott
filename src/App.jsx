import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import MainLayout from './pages/MainLayout'
import StickyNote from './pages/StickyNote'
import CommandPalette from './components/CommandPalette/CommandPalette'
import SettingsModal from './components/Settings/SettingsModal'
import { useNotesStore } from './store/notesStore'
import { useWorkspaceStore } from './store/workspaceStore'
import { useUIStore } from './store/uiStore'
import { useTheme } from './hooks/useTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const params = new URLSearchParams(window.location.search)
const isStickyMode = params.get('mode') === 'sticky'
const stickyNoteId = params.get('noteId')

export default function App() {
  useTheme()
  useKeyboardShortcuts()

  const initNotes = useNotesStore(s => s.init)
  const initWorkspaces = useWorkspaceStore(s => s.init)
  const commandPaletteOpen = useUIStore(s => s.commandPaletteOpen)
  const settingsOpen = useUIStore(s => s.settingsOpen)

  useEffect(() => {
    initNotes()
    initWorkspaces()
  }, [initNotes, initWorkspaces])

  if (isStickyMode && stickyNoteId) {
    return <StickyNote noteId={stickyNoteId} />
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <MainLayout />
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette key="cmd-palette" />}
        {settingsOpen && <SettingsModal key="settings" />}
      </AnimatePresence>
    </div>
  )
}
