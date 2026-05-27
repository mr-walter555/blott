import { useEffect } from 'react'
import { useNotesStore } from '../store/notesStore'
import { useUIStore } from '../store/uiStore'

export function useKeyboardShortcuts() {
  const createNote = useNotesStore(s => s.createNote)
  const openCommandPalette = useUIStore(s => s.openCommandPalette)
  const openSettings = useUIStore(s => s.openSettings)
  const openShareModal = useUIStore(s => s.openShareModal)

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

      if (ctrl && e.key === ',') {
        e.preventDefault()
        openSettings()
      }

      if (ctrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const { notes, selectedNoteId } = useNotesStore.getState()
        const note = notes[selectedNoteId]
        if (note && !note.trashed) openShareModal()
      }

      if (ctrl && e.key === 'f') {
        e.preventDefault()
        document.querySelector('[data-search-input]')?.focus()
      }

      if (e.key === 'Escape') {
        const { commandPaletteOpen, settingsOpen, closeCommandPalette, closeSettings } = useUIStore.getState()
        if (commandPaletteOpen) closeCommandPalette()
        else if (settingsOpen) closeSettings()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [createNote, openCommandPalette, openSettings])
}