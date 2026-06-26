import { useState, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, ArrowCounterClockwise, Trash, FileText, Eye } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useNotesStore } from '../../store/notesStore'
import DeleteConfirmModal from './DeleteConfirmModal'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import EmptyState from '../common/EmptyState'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function TrashModal({ anchorY, onClose }) {
  const [search, setMagnifyingGlass]         = useState('')
  const [confirmNote, setConfirmNote] = useState(null)
  const inputRef = useRef(null)
  const dialogRef = useFocusTrap()

  const allNotes      = useNotesStore(s => s.notes)
  const restoreNote   = useNotesStore(s => s.restoreNote)
  const deleteNote    = useNotesStore(s => s.deleteNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)

  const trashed = useMemo(() => {
    const list = Object.values(allNotes).filter(n => n.trashed)
    if (!search.trim()) return list
    return list.filter(n => (n.title || '').toLowerCase().includes(search.toLowerCase()))
  }, [allNotes, search])

  useEffect(() => {
    inputRef.current?.focus()
    const handler = e => {
      if (e.key === 'Escape') {
        if (confirmNote) { setConfirmNote(null); return }
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [confirmNote])

  const handleDelete = () => {
    deleteNote(confirmNote.id)
    setConfirmNote(null)
    toast.success('Note permanently deleted', { iconTheme: { primary: '#ef4444', secondary: '#fff' } })
  }

  const top = Math.min(anchorY, window.innerHeight - 560)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Trash"
        className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden flex flex-col"
        style={{ top, left: 268, width: 360, maxHeight: 560 }}
      >
        {/* MagnifyingGlass */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 focus-within:border-brown-400 dark:focus-within:border-brown-500 rounded-lg transition-colors">
            <MagnifyingGlass className="w-4 h-4 text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setMagnifyingGlass(e.target.value)}
              placeholder="Search in Trash…"
              className="flex-1 text-sm outline-none text-gray-700 dark:text-gray-200 placeholder:text-muted dark:placeholder:text-gray-600 bg-transparent"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {trashed.length === 0 ? (
            <EmptyState icon={Trash} message={search ? 'No results found' : 'Trash is empty'} className="py-12" iconClassName="w-8 h-8 text-gray-200 dark:text-gray-700" centered />
          ) : (
            trashed.map(note => (
              <div
                key={note.id}
                onClick={() => { setSelectedNote(note.id); onClose() }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                title="Open (read-only)"
              >
                <FileText className="w-4 h-4 text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{note.title || 'Untitled'}</p>
                  <p className="text-[11px] text-muted dark:text-gray-600">{timeAgo(note.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="p-1.5 text-muted dark:text-gray-600" title="Click to preview">
                    <Eye className="w-3.5 h-3.5" />
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); restoreNote(note.id); toast.success('Note restored') }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] text-muted hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Restore" aria-label="Restore"
                  >
                    <ArrowCounterClockwise className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmNote(note) }}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete permanently" aria-label="Delete permanently"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-muted dark:text-gray-600 leading-snug">Notes auto-delete after 30 days.</p>
          {trashed.length > 0 && (
            <span className="text-xs text-muted dark:text-gray-600 tabular-nums">{trashed.length} note{trashed.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmNote && (
          <DeleteConfirmModal
            key="delete-confirm"
            note={confirmNote}
            onConfirm={handleDelete}
            onCancel={() => setConfirmNote(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
