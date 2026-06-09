import { useState, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, Plus, FileText, X } from '@phosphor-icons/react'
import { useNotesStore } from '../../store/notesStore'

export default function WorkspaceNotesModal({ workspace, anchorY, onClose }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  const allNotes        = useNotesStore(s => s.notes)
  const createNote      = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const selectedNoteId  = useNotesStore(s => s.selectedNoteId)

  const notes = useMemo(() => {
    const list = Object.values(allNotes).filter(
      n => n.workspaceId === workspace.id && !n.trashed && !n.archived
    )
    if (!search.trim()) return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    return list
      .filter(n => (n.title || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [allNotes, workspace.id, search])

  useEffect(() => {
    inputRef.current?.focus()
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleNewNote() {
    const note = await createNote({ workspaceId: workspace.id })
    setSelectedNote(note.id)
    onClose()
  }

  function openNote(noteId) {
    setSelectedNote(noteId)
    onClose()
  }

  const top = Math.min(anchorY - 8, window.innerHeight - 440)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden flex flex-col"
        style={{ top, left: 268, width: 360, maxHeight: 440 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: (workspace.color || '#b45309') + '20', color: workspace.color || '#b45309' }}>
              {(workspace.name || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-800 truncate">{workspace.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleNewNote}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="New note in workspace">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <MagnifyingGlass className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search in workspace…"
              className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
            />
          </div>
        </div>

        <div className="mx-3 border-t border-gray-100 mb-1 flex-shrink-0" />

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <FileText className="w-7 h-7 text-gray-200" />
              <p className="text-sm text-gray-400">{search ? 'No results found' : 'No notes in this workspace'}</p>
              {!search && (
                <button onClick={handleNewNote}
                  className="text-xs text-brown-500 hover:text-brown-600 font-medium transition-colors">
                  Create the first note
                </button>
              )}
            </div>
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                onClick={() => openNote(note.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                  note.id === selectedNoteId ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className={`text-sm truncate ${
                  note.id === selectedNoteId ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}>
                  {note.title || 'Untitled'}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">{notes.length} {notes.length === 1 ? 'note' : 'notes'} in workspace</p>
        </div>
      </div>
    </>
  )
}
