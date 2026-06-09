import { useState, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, ArrowCounterClockwise, Trash, FileText, Warning, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useNotesStore } from '../../store/notesStore'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function DeleteConfirmModal({ note, onConfirm, onCancel }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Warning className="w-5 h-5 text-red-500" weight="fill" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete permanently?</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  "{note.title || 'Untitled'}" will be gone forever.
                </p>
              </div>
            </div>
            <button onClick={onCancel} className="btn-icon flex-shrink-0 ml-2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p className="px-5 pb-4 text-xs text-gray-400 leading-relaxed">
            This action cannot be undone. The note will be removed from all devices and cannot be recovered.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm rounded-xl text-gray-600 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              Delete forever
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default function TrashModal({ anchorY, onClose }) {
  const [search, setSearch]         = useState('')
  const [confirmNote, setConfirmNote] = useState(null)
  const inputRef = useRef(null)

  const allNotes    = useNotesStore(s => s.notes)
  const restoreNote = useNotesStore(s => s.restoreNote)
  const deleteNote  = useNotesStore(s => s.deleteNote)

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
    toast.error('Note permanently deleted')
  }

  const top = Math.min(anchorY, window.innerHeight - 560)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden flex flex-col"
        style={{ top, left: 268, width: 360, maxHeight: 560 }}
      >
        {/* Search */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 focus-within:border-brown-400 rounded-lg transition-colors">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search in Trash…"
              className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {trashed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Trash className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">{search ? 'No results found' : 'Trash is empty'}</p>
            </div>
          ) : (
            trashed.map(note => (
              <div key={note.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{note.title || 'Untitled'}</p>
                  <p className="text-[11px] text-gray-400">{timeAgo(note.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { restoreNote(note.id); toast.success('Note restored') }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Restore"
                  >
                    <ArrowCounterClockwise className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmNote(note)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400 leading-snug">Notes auto-delete after 30 days.</p>
          {trashed.length > 0 && (
            <span className="text-xs text-gray-400 tabular-nums">{trashed.length} note{trashed.length !== 1 ? 's' : ''}</span>
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
