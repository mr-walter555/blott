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

  // Keep callbacks in a ref so persist() never needs to change identity
  // when the parent re-renders with new inline function references.
  const cbRef = useRef({ onSaving, onSaved, onError })
  cbRef.current = { onSaving, onSaved, onError }

  const persist = useCallback(async (noteId, content, title) => {
    cbRef.current.onSaving?.()
    try {
      await updateNote(noteId, { content, title })
      lastSavedRef.current = { content, title }
      cbRef.current.onSaved?.()
    } catch (err) {
      console.error('Failed to persist note update:', err)
      cbRef.current.onError?.()
    }
  }, [updateNote])

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
