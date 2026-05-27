import { useMemo } from 'react'
import { Plus, MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNotesStore } from '../../store/notesStore'
import { useUIStore } from '../../store/uiStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import NoteCard from './NoteCard'

const VIEW_LABELS = {
  all: 'All Notes',
  favorites: 'Favorites',
  pinned: 'Pinned',
  archived: 'Archived',
  trash: 'Trash',
  workspace: null,
}

export default function NotesList() {
  const createNote = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const getActiveNotes = useNotesStore(s => s.getActiveNotes)
  const selectedNoteId = useNotesStore(s => s.selectedNoteId)
  const allNotes = useNotesStore(s => s.notes)

  const activeView = useUIStore(s => s.activeView)
  const activeWorkspaceId = useUIStore(s => s.activeWorkspaceId)
  const searchQuery = useUIStore(s => s.searchQuery)
  const setSearchQuery = useUIStore(s => s.setSearchQuery)

  const workspaces = useWorkspaceStore(s => s.workspaces)

  const notes = useMemo(
    () => getActiveNotes(activeView, activeWorkspaceId, searchQuery),
    [getActiveNotes, activeView, activeWorkspaceId, searchQuery, allNotes]
  )

  const label = activeWorkspaceId
    ? workspaces[activeWorkspaceId]?.name || 'Workspace'
    : VIEW_LABELS[activeView] || 'Notes'

  const handleNewNote = async () => {
    const note = await createNote({ workspaceId: activeWorkspaceId || null })
    setSelectedNote(note.id)
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{label}</h2>
          {activeView !== 'trash' && activeView !== 'archived' && (
            <button onClick={handleNewNote} className="btn-icon" title="New note (Ctrl+N)">
              <Plus className="w-5 h-5 text-black dark:text-white" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white" />
          <input
            data-search-input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-brown-500/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5">
        <AnimatePresence initial={false}>
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="text-3xl mb-3">
                {searchQuery ? '🔍' : activeView === 'trash' ? '🗑️' : '📭'}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {searchQuery ? 'No results found' : activeView === 'trash' ? 'Trash is empty' : 'No notes yet'}
              </p>
              {!searchQuery && activeView === 'all' && (
                <button
                  onClick={handleNewNote}
                  className="mt-3 text-xs text-brown-500 hover:text-brown-600 font-medium"
                >
                  + Create your first note
                </button>
              )}
            </motion.div>
          ) : (
            notes.map(note => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <NoteCard
                  note={note}
                  selected={note.id === selectedNoteId}
                  onClick={() => setSelectedNote(note.id)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </>
  )
}