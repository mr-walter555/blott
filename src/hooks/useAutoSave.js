import { useEffect, useRef, useCallback } from 'react'
import { useNotesStore } from '../store/notesStore'
import { useUIStore } from '../store/uiStore'

export function useAutoSave(noteId, content, title, { onSaving, onSaved, onError } = {}) {
  const updateNote = useNotesStore(s => s.updateNote)
  const autoSaveInterval = useUIStore(s => s.autoSaveInterval)
  const timerRef = useRef(null)
  const lastSavedRef = useRef({ content, title })
  const latestRef = useRef({ noteId, content, title })
  latestRef.current = { noteId, content, title }

  const persist = useCallback(async (noteId, content, title) => {
    onSaving?.()
    try {
      await updateNote(noteId, { content, title })
      lastSavedRef.current = { content, title }
      onSaved?.()
    } catch (err) {
      console.error('Failed to persist note update:', err)
      onError?.()
    }
  }, [updateNote, onSaving, onSaved, onError])

  const flush = useCallback(() => {
    const { noteId, content, title } = latestRef.current
    if (!noteId) return
    const hasChanged =
      content !== lastSavedRef.current.content ||
      title !== lastSavedRef.current.title
    if (!hasChanged) return
    if (timerRef.current) clearTimeout(timerRef.current)
    persist(noteId, content, title)
  }, [persist])

  useEffect(() => {
    if (!noteId) return
    const hasChanged =
      content !== lastSavedRef.current.content ||
      title !== lastSavedRef.current.title
    if (!hasChanged) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      persist(noteId, content, title)
    }, autoSaveInterval)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [noteId, content, title, autoSaveInterval, persist])

  useEffect(() => {
    lastSavedRef.current = { content, title }
  }, [noteId])

  return flush
}
