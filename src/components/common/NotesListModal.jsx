import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlass, FileText, Star, PushPin as PushPinRaw, Archive, X } from '@phosphor-icons/react'
import { useNotesStore } from '../../store/notesStore'
import { MODAL_BACKDROP, MODAL_CONTENT } from '../../utils/motionPresets'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import EmptyState from './EmptyState'

const VIEW_META = {
  all:       { title: 'All Notes', icon: FileText,  empty: 'No notes yet' },
  favorites: { title: 'Favorites', icon: Star,       empty: 'No favourite notes yet' },
  pinned:    { title: 'Pinned',    icon: PushPinRaw, empty: 'No pinned notes yet' },
  archived:  { title: 'Archived',  icon: Archive,    empty: 'No archived notes' },
}

export default function NotesListModal({ view, onClose }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)
  const dialogRef = useFocusTrap()

  const getActiveNotes  = useNotesStore(s => s.getActiveNotes)
  const allNotes        = useNotesStore(s => s.notes)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)

  const notes = useMemo(
    () => getActiveNotes(view, null, search),
    [getActiveNotes, view, search, allNotes]
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const meta = VIEW_META[view] || VIEW_META.all
  const Icon = meta.icon

  return (
    <>
      <motion.div {...MODAL_BACKDROP} onClick={onClose} className="fixed inset-0 z-50 bg-black/40" />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div {...MODAL_CONTENT} className="w-full max-w-md pointer-events-auto">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={meta.title}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '32rem' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{meta.title}</span>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Close">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 focus-within:border-brown-400 dark:focus-within:border-brown-500 rounded-lg transition-colors">
                <MagnifyingGlass className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${meta.title.toLowerCase()}…`}
                  className="flex-1 text-sm outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-transparent"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {notes.length === 0 ? (
                <EmptyState icon={Icon} message={search ? 'No results found' : meta.empty} className="py-12" />
              ) : (
                notes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => { setSelectedNote(note.id); onClose() }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{note.title || 'Untitled'}</span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <p className="text-xs text-gray-400 dark:text-gray-600">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
