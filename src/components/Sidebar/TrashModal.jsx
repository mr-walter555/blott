import { useState, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, ArrowCounterClockwise, Trash, FileText, Warning } from '@phosphor-icons/react'
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

export default function TrashModal({ anchorY, onClose }) {
  const [search, setSearch]       = useState('')
  const [confirmId, setConfirmId] = useState(null)
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
        if (confirmId) { setConfirmId(null); return }
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [confirmId])

  const handleDelete = (id) => {
    deleteNote(id)
    setConfirmId(null)
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
              <div key={note.id}>
                {confirmId === note.id ? (
                  /* Inline confirmation */
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border-l-2 border-red-400">
                    <Warning className="w-4 h-4 text-red-500 flex-shrink-0" weight="fill" />
                    <span className="flex-1 text-xs text-red-700 leading-snug">Delete permanently?<br />This cannot be undone.</span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
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
                        onClick={() => setConfirmId(note.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400 leading-snug">
            Notes auto-delete after 30 days.
          </p>
          {trashed.length > 0 && (
            <span className="text-xs text-gray-400 tabular-nums">{trashed.length} note{trashed.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </>
  )
}
