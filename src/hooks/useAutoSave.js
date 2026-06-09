import { useEffect, useRef, useCallback } from 'react'
import { useNotesStore } from '../store/notesStore'
import { useUIStore } from '../store/uiStore'
import { syncShare } from '../services/shareService'

export function useAutoSave(noteId, content, title, shareToken) {
  const updateNote = useNotesStore(s => s.updateNote)
  const autoSaveInterval = useUIStore(s => s.autoSaveInterval)
  const timerRef = useRef(null)
  const lastSavedRef = useRef({ content, title })
  const latestRef = useRef({ noteId, content, title, shareToken })
  latestRef.current = { noteId, content, title, shareToken }

  const flush = useCallback(() => {
    const { noteId, content, title, shareToken } = latestRef.current
    if (!noteId) return
    const hasChanged =
      content !== lastSavedRef.current.content ||
      title !== lastSavedRef.current.title
    if (!hasChanged) return

    if (timerRef.current) clearTimeout(timerRef.current)
    updateNote(noteId, { content, title })
    lastSavedRef.current = { content, title }
    if (shareToken) syncShare(shareToken, { title: title || 'Untitled', content })
  }, [updateNote])

  useEffect(() => {
    if (!noteId) return
    const hasChanged =
      content !== lastSavedRef.current.content ||
      title !== lastSavedRef.current.title

    if (!hasChanged) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      updateNote(noteId, { content, title })
      lastSavedRef.current = { content, title }
      if (shareToken) syncShare(shareToken, { title: title || 'Untitled', content })
    }, autoSaveInterval)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [noteId, content, title, shareToken, updateNote, autoSaveInterval])

  useEffect(() => {
    lastSavedRef.current = { content, title }
  }, [noteId])

  return flush
}
