import { useState, useRef } from 'react'
import {
  GearSix, Plus, SidebarSimple, MagnifyingGlass,
  CaretDown, CaretRight, Note, Star, ListDashes, Bookmarks,
  DotsThree, Trash, PencilSimple, BookOpen, Archive, Question, Folder, Clock
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useShallow } from 'zustand/react/shallow'
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import WorkspaceSection from './WorkspaceSection'
import TrashModal from './TrashModal'
import EmptyState from '../common/EmptyState'
import { GUIDE_NOTE_ID } from '../../utils/guideNote'

function NoteIcon({ note }) {
  if (note.id === GUIDE_NOTE_ID) return <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />
  if (note.content?.includes('data-type="taskList"'))
    return <ListDashes className="w-5 h-5 text-muted flex-shrink-0" />
  return <Note className="w-5 h-5 text-muted flex-shrink-0" />
}

export default function Sidebar() {
  const sidebarCollapsed   = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar      = useUIStore(s => s.toggleSidebar)
  const openGearSix        = useUIStore(s => s.openSettings)
  const openCommandPalette = useUIStore(s => s.openCommandPalette)
  const activeWorkspaceId  = useUIStore(s => s.activeWorkspaceId)

  const createNote      = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const selectedNoteId  = useNotesStore(s => s.selectedNoteId)
  const updateNote      = useNotesStore(s => s.updateNote)
  const archiveNote     = useNotesStore(s => s.archiveNote)
  const trashNote       = useNotesStore(s => s.trashNote)

  const favoriteNotes = useNotesStore(useShallow(s =>
    Object.values(s.notes)
      .filter(n => n.favorite && !n.trashed && !n.archived)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  ))

  const recentNotes = useNotesStore(useShallow(s =>
    Object.values(s.notes)
      .filter(n => !n.trashed && !n.archived)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
  ))

  const trashedCount = useNotesStore(
    s => Object.values(s.notes).filter(n => n.trashed).length
  )

  const [workspacesExpanded, setWorkspacesExpanded] = useState(true)
  const [favoritesExpanded, setFavoritesExpanded]   = useState(true)
  const [trashAnchorY, setTrashAnchorY] = useState(null)
  const [menu,         setMenu]         = useState(null)
  const [renamingId,   setRenamingId]   = useState(null)
  const [renameValue,  setRenameValue]  = useState('')
  const renameRef = useRef(null)

  const menuNote = useNotesStore(s => menu ? s.notes[menu.noteId] ?? null : null)

  function openMenu(e, note) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu({ noteId: note.id, x: rect.right + 8, y: rect.top })
  }

  const handleNewNote = async () => {
    const note = await createNote({ workspaceId: activeWorkspaceId || null })
    setSelectedNote(note.id)
  }

  const c = sidebarCollapsed

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-925 border-r border-gray-200 dark:border-gray-800 select-none overflow-hidden w-full">

      {/* Header — toggle button always centered, stays put */}
      <div className="flex items-center justify-between pt-4 pb-2 px-3">
        <button onClick={toggleSidebar} className="btn-icon flex-shrink-0" title={c ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}>
          <SidebarSimple className="w-5 h-5 text-black dark:text-white" />
        </button>
      </div>

      {/* Search + New Note */}
      <div className="pt-1 pb-3 px-1.5">
        {c ? (
          <div className="space-y-1.5">
            <button onClick={openCommandPalette} title="Quick search" aria-label="Quick search" className="w-full flex items-center justify-center p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <MagnifyingGlass className="w-5 h-5 text-black dark:text-white" />
            </button>
            <button onClick={handleNewNote} title="New Note" aria-label="New Note" className="w-full flex items-center justify-center p-2 rounded-lg bg-brown-600 hover:bg-brown-700 transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-1.5">
            <button
              onClick={openCommandPalette}
              title="Quick search  ⌘K"
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-0"
            >
              <MagnifyingGlass className="w-4 h-4 text-muted flex-shrink-0" />
              <span className="truncate text-muted">Search notes…</span>
            </button>
            <button
              onClick={handleNewNote}
              title="New Note  Ctrl+N"
              aria-label="New Note (Ctrl+N)"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-brown-600 hover:bg-brown-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      <div className="mx-3 border-t border-gray-200 dark:border-gray-800 mb-1" />

      {/* Scrollable nav — icons always at px-3, never repositioned during GSAP animation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>

        {/* Recents */}
        <button
          onClick={c ? toggleSidebar : undefined}
          className="flex items-center gap-1.5 w-full px-4 pt-2 pb-1"
          title={c ? 'Expand sidebar' : undefined}
          style={{ cursor: c ? 'pointer' : 'default' }}
        >
          <Clock className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
          {!c && <span className="section-label">Recents</span>}
        </button>

        {!c && (
          recentNotes.length === 0 ? (
            <EmptyState message="No notes yet" className="py-3" />
          ) : (
            recentNotes.map(note => (
              <div key={note.id} className="relative group">
                {renamingId === note.id ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <NoteIcon note={note} />
                    <input
                      ref={renameRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { if (renameValue.trim()) updateNote(note.id, { title: renameValue.trim() }); setRenamingId(null) }
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onBlur={() => { if (renameValue.trim()) updateNote(note.id, { title: renameValue.trim() }); setRenamingId(null) }}
                      className="flex-1 text-sm bg-white border border-brown-300 rounded px-1.5 py-0.5 outline-none text-gray-900"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setSelectedNote(note.id)}
                    className={`w-full flex items-center gap-2.5 mx-1.5 px-2.5 py-2 text-left rounded-lg transition-colors cursor-pointer ${
                      note.id === selectedNoteId
                        ? 'bg-gray-200/70 dark:bg-gray-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <NoteIcon note={note} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        note.id === selectedNoteId
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-muted'
                      }`}>
                        {note.title || 'Untitled'}
                      </p>
                    </div>
                    <button
                      onClick={e => openMenu(e, note)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0 focus:opacity-100"
                      tabIndex={0}
                    >
                      <DotsThree className="w-4 h-4 text-muted" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )
        )}

        {!c && <div className="mx-3 border-t border-gray-200 dark:border-gray-800 my-2" />}

        {/* Favorites */}
        <div className="px-1">
          <button
            onClick={c ? toggleSidebar : () => setFavoritesExpanded(!favoritesExpanded)}
            className="sidebar-item w-full"
          >
            <Bookmarks className="w-5 h-5 flex-shrink-0 text-black dark:text-white" />
            {!c && <span className="flex-1 text-left text-xs font-semibold text-muted uppercase tracking-wider">Favorites</span>}
            {!c && (favoritesExpanded ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />)}
          </button>
        </div>
        {!c && favoritesExpanded && (
          favoriteNotes.length === 0 ? (
            <EmptyState message="No favourites yet" className="py-3" />
          ) : (
            <div className="space-y-0.5 py-1">
              {favoriteNotes.map(note => (
                <div key={note.id} className="relative group">
                  <div
                    onClick={() => setSelectedNote(note.id)}
                    className={`w-full flex items-center gap-2.5 mx-1.5 px-2.5 py-2 text-left rounded-lg transition-colors cursor-pointer ${
                      note.id === selectedNoteId
                        ? 'bg-gray-200/70 dark:bg-gray-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Note className="w-5 h-5 text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        note.id === selectedNoteId
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-muted'
                      }`}>
                        {note.title || 'Untitled'}
                      </p>
                    </div>
                    <button
                      onClick={e => openMenu(e, note)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0 focus:opacity-100"
                      tabIndex={0}
                    >
                      <DotsThree className="w-4 h-4 text-muted" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!c && <div className="mx-3 border-t border-gray-200 dark:border-gray-800 my-2" />}

        {/* Workspaces */}
        <div className="px-1">
          <button
            onClick={c ? toggleSidebar : () => setWorkspacesExpanded(!workspacesExpanded)}
            className="sidebar-item w-full"
          >
            <Folder className="w-5 h-5 flex-shrink-0 text-black dark:text-white" />
            {!c && <span className="flex-1 text-left text-xs font-semibold text-muted uppercase tracking-wider">Workspaces</span>}
            {!c && (workspacesExpanded ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />)}
          </button>
          {!c && workspacesExpanded && <WorkspaceSection />}
        </div>

      </div>

      {/* Footer */}
      <div className="pb-3 pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-0.5 px-1">
        <button
          onClick={e => setTrashAnchorY(e.currentTarget.getBoundingClientRect().top)}
          title="Trash"
          aria-label="Trash"
          className="sidebar-item w-full"
        >
          <Trash className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
          {!c && <span className="whitespace-nowrap">Trash</span>}
          {trashedCount > 0 && !c && (
            <span className="ml-auto text-xs text-muted">{trashedCount}</span>
          )}
        </button>
        <button
          onClick={openGearSix}
          title="Settings"
          aria-label="Settings"
          className="sidebar-item w-full"
        >
          <GearSix className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
          {!c && <span className="whitespace-nowrap">Settings</span>}
        </button>
        <button
          onClick={() => setSelectedNote(GUIDE_NOTE_ID)}
          title="Help"
          aria-label="Help"
          className="sidebar-item w-full"
        >
          <Question className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
          {!c && <span className="whitespace-nowrap">Help</span>}
        </button>
      </div>

      {trashAnchorY !== null && (
        <TrashModal anchorY={trashAnchorY} onClose={() => setTrashAnchorY(null)} />
      )}

      {menu && menuNote && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md py-2 w-56"
            style={{ top: menu.y, left: menu.x }}
          >
            <div className="px-4 py-1.5 mb-1">
              <p className="text-xs font-semibold text-muted">Note</p>
            </div>

            <button
              onClick={() => { updateNote(menuNote.id, { favorite: !menuNote.favorite }); setMenu(null); toast(menuNote.favorite ? 'Removed from favourites' : 'Added to favourites', { icon: <Star className="w-4 h-4 text-yellow-400" /> }) }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Star className={`w-4 h-4 ${menuNote.favorite ? 'text-yellow-400' : 'text-muted'}`} weight={menuNote.favorite ? 'fill' : 'regular'} />
              {menuNote.favorite ? 'Remove from favourites' : 'Add to favourites'}
            </button>

            <button
              onClick={() => { setRenamingId(menuNote.id); setRenameValue(menuNote.title || ''); setMenu(null) }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              <PencilSimple className="w-4 h-4 text-muted" />
              Rename
            </button>

            <button
              onClick={() => { archiveNote(menuNote.id, !menuNote.archived); setMenu(null); toast(menuNote.archived ? 'Note unarchived' : 'Note archived', { icon: <Archive className="w-4 h-4 text-muted" /> }) }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Archive className={`w-4 h-4 ${menuNote.archived ? 'text-brown-500' : 'text-muted'}`} weight={menuNote.archived ? 'fill' : 'regular'} />
              {menuNote.archived ? 'Unarchive' : 'Archive'}
            </button>

            {menuNote.id !== GUIDE_NOTE_ID && (
              <>
                <div className="mx-3 my-1 border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={() => { trashNote(menuNote.id, true); setMenu(null); toast('Moved to Trash', { icon: <Trash className="w-4 h-4 text-red-500" /> }) }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  Move to Trash
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
