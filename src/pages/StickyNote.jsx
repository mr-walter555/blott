import { useState, useEffect, useRef } from 'react'
import { X, Minus, ArrowsOut, ArrowSquareOut } from '@phosphor-icons/react'
import { useNotesStore } from '../store/notesStore'
import { useTheme } from '../hooks/useTheme'
import { getColorClasses, NOTE_COLORS } from '../utils/noteColors'
import { stripHtml } from '../utils/helpers'

export default function StickyNote({ noteId }) {
  useTheme()

  const [note, setNote] = useState(null)
  const [minimized, setMinimized] = useState(false)
  const initNotes = useNotesStore(s => s.init)
  const notes = useNotesStore(s => s.notes)
  const dragRef = useRef(null)

  useEffect(() => {
    initNotes()
  }, [])

  useEffect(() => {
    const n = notes[noteId]
    if (n) setNote(n)
  }, [notes, noteId])

  useEffect(() => {
    if (window.electronAPI?.onNoteUpdated) {
      return window.electronAPI.onNoteUpdated((updated) => {
        if (updated.id === noteId) setNote(updated)
      })
    }
  }, [noteId])

  if (!note) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brown-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const colorInfo = NOTE_COLORS[note.color] || NOTE_COLORS.default
  const bgColor = colorInfo.swatch
    ? `${colorInfo.swatch}20`
    : undefined

  const handleClose = () => {
    if (window.electronAPI?.floating) {
      window.electronAPI.floating.close(noteId)
    } else {
      window.close()
    }
  }

  return (
    <div
      className={`h-screen flex flex-col rounded-2xl overflow-hidden shadow-2xl border ${
        note.color !== 'default'
          ? `${colorInfo.card} ${colorInfo.cardDark}`
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
      }`}
      style={bgColor ? { background: bgColor } : {}}
    >
      {/* Drag handle / title bar */}
      <div
        ref={dragRef}
        className="flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 cursor-grab active:cursor-grabbing select-none"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate flex-1">
          {note.title || 'Untitled'}
        </span>
        <div
          className="flex items-center gap-1 ml-2"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <button
            onClick={() => setMinimized(!minimized)}
            className="w-5 h-5 rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center transition-colors"
            title="Minimize"
          >
            <Minus className="w-2.5 h-2.5 text-yellow-900" />
          </button>
          <button
            onClick={handleClose}
            className="w-5 h-5 rounded-full bg-red-400 hover:bg-red-500 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-2.5 h-2.5 text-red-900" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div className="flex-1 overflow-y-auto p-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          {note.content ? (
            <div
              className="tiptap-preview"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <p className="text-gray-400 dark:text-gray-600 italic">Empty note</p>
          )}
        </div>
      )}

    </div>
  )
}