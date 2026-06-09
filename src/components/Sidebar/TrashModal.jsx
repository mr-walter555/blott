import { useState, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, ArrowCounterClockwise, Trash, FileText } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useNotesStore } from '../../store/notesStore'

export default function TrashModal({ anchorY, onClose }) {
  const [search, setSearch] = useState('')
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
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
          <div className="flex items-center gap-2 px-3 py-2 border border-blue-400 rounded-lg">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pages in Trash"
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
              <div key={note.id}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{note.title || 'Untitled'}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { restoreNote(note.id); toast.success('Note restored') }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Restore">
                    <ArrowCounterClockwise className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { deleteNote(note.id); toast('Deleted permanently', { icon: '🗑️' }) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete permanently">
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 leading-snug">
            Notes in Trash are permanently deleted after 30 days.
          </p>
        </div>
      </div>
    </>
  )
}
