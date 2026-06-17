import { useEffect } from 'react'
import { useNotesStore } from '../store/notesStore'
import { useUIStore } from '../store/uiStore'
import { exportAsPDF } from '../utils/exportNote'

export function useKeyboardShortcuts() {
  const createNote = useNotesStore(s => s.createNote)
  const openCommandPalette = useUIStore(s => s.openCommandPalette)
  const openSettings = useUIStore(s => s.openSettings)
  const openAskAI = useUIStore(s => s.openAskAI)

  useEffect(() => {
    const handler = async (e) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && !e.shiftKey && e.key === 'n') {
        e.preventDefault()
        const note = await createNote()
        useNotesStore.getState().setSelectedNote(note.id)
      }

      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        openCommandPalette()
      }

      // Print the current note via the OS print dialog (same flow as "Export as PDF").
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        const { notes, selectedNoteId } = useNotesStore.getState()
        const note = notes[selectedNoteId]
        if (note) exportAsPDF(note.title, note.content)
      }

      if (ctrl && e.key === ',') {
        e.preventDefault()
        openSettings()
      }

      if (ctrl && !e.shiftKey && e.key === 'f') {
        e.preventDefault()
        openCommandPalette()
      }

      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        openAskAI()
      }

      if (e.key === 'Escape') {
        const { commandPaletteOpen, settingsOpen, askAIOpen, closeCommandPalette, closeSettings, closeAskAI } = useUIStore.getState()
        if (commandPaletteOpen) closeCommandPalette()
        else if (settingsOpen) closeSettings()
        else if (askAIOpen) closeAskAI()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [createNote, openCommandPalette, openSettings, openAskAI])
}