import { useState, useMemo, useRef } from 'react'
import {
  GearSix, Plus, SidebarSimple, MagnifyingGlass,
  CaretDown, CaretRight, FileText, Star, PushPin as PushPinRaw, ListChecks,
  DotsThree, Trash, PencilSimple, TrashSimple, BookOpen
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import WorkspaceSection from './WorkspaceSection'
import TrashModal from './TrashModal'
import { GUIDE_NOTE_ID } from '../../utils/guideNote'

const PushPin = (props) => <PushPinRaw {...props} style={{ transform: 'rotate(-45deg)' }} />

const labelVariants = {
  visible: { opacity: 1, transition: { duration: 0.15, delay: 0.15 } },
  hidden:  { opacity: 0, transition: { duration: 0.08 } },
}

function FadeLabel({ show, children, className = '' }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          key="label"
          variants={labelVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`overflow-hidden whitespace-nowrap ${className}`}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

function NoteIcon({ note }) {
  if (note.id === GUIDE_NOTE_ID) return <BookOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
  if (note.favorite) return <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" weight="fill" />
  if (note.pinned)   return <PushPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
  if (note.content?.includes('data-type="taskList"'))
    return <ListChecks className="w-4 h-4 text-gray-400 flex-shrink-0" />
  return <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
}

export default function Sidebar() {
  const sidebarCollapsed   = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar      = useUIStore(s => s.toggleSidebar)
  const openSettings       = useUIStore(s => s.openSettings)
  const openCommandPalette = useUIStore(s => s.openCommandPalette)
  const activeWorkspaceId  = useUIStore(s => s.activeWorkspaceId)
  const setActiveView      = useUIStore(s => s.setActiveView)
  const activeView         = useUIStore(s => s.activeView)

  const allNotes        = useNotesStore(s => s.notes)
  const createNote      = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const selectedNoteId  = useNotesStore(s => s.selectedNoteId)
  const getActiveNotes  = useNotesStore(s => s.getActiveNotes)
  const updateNote      = useNotesStore(s => s.updateNote)
  const trashNote       = useNotesStore(s => s.trashNote)

  const [workspacesExpanded, setWorkspacesExpanded] = useState(true)
  const [trashAnchorY, setTrashAnchorY] = useState(null)
  const [menu,         setMenu]         = useState(null) // { noteId, x, y }
  const [renamingId,   setRenamingId]   = useState(null)
  const [renameValue,  setRenameValue]  = useState('')
  const renameRef = useRef(null)

  function openMenu(e, note) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu({ noteId: note.id, x: rect.right + 8, y: rect.top })
  }

  const recentNotes = useMemo(() => {
    const list = Object.values(allNotes).filter(n => !n.trashed && !n.archived)
    return [...list]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 30)
  }, [allNotes])

  const handleNewNote = async () => {
    const note = await createNote({ workspaceId: activeWorkspaceId || null })
    setSelectedNote(note.id)
  }

  const c = sidebarCollapsed

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-925 border-r border-gray-200 dark:border-gray-800 select-none overflow-hidden w-full">

      {/* Header */}
      <div className={`flex items-center pt-4 pb-2 transition-all duration-250 ${c ? 'justify-center px-0' : 'justify-between px-3'}`}>
        <button onClick={toggleSidebar} className="btn-icon flex-shrink-0" title={c ? 'Expand sidebar' : 'Collapse sidebar'}>
          <SidebarSimple className="w-5 h-5 text-black dark:text-white" />
        </button>
      </div>

      {/* New Note + Search */}
      <div className={`pt-1 pb-3 space-y-1.5 transition-all duration-250 ${c ? 'px-1.5' : 'px-3'}`}>
        <button
          onClick={handleNewNote}
          title="New Note"
          className={`w-full flex items-center rounded-lg bg-brown-600 hover:bg-brown-700 text-white text-sm font-medium transition-colors shadow-sm ${c ? 'justify-center p-2' : 'gap-2 px-3 py-2'}`}
        >
          <Plus className="w-5 h-5 text-white flex-shrink-0" />
          <FadeLabel show={!c}>New Note</FadeLabel>
        </button>
        <button
          onClick={openCommandPalette}
          title="Quick search"
          className={`w-full flex items-center rounded-lg text-sm text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${c ? 'justify-center p-2' : 'gap-2 px-3 py-2'}`}
        >
          <MagnifyingGlass className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
          <FadeLabel show={!c} className="flex items-center flex-1 min-w-0">
            <span className="flex-1">Quick search…</span>
            <span className="text-xs opacity-50 font-mono">⌘K</span>
          </FadeLabel>
        </button>
      </div>

      <div className="mx-3 border-t border-gray-200 dark:border-gray-800 mb-1" />

      {/* Recents + Workspaces */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence initial={false}>
          {!c && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
            >
              {/* Recents label */}
              <div className="px-4 pt-2 pb-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Recents</span>
              </div>

              {/* Note rows */}
              {recentNotes.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400">No notes yet</p>
                </div>
              ) : (
                recentNotes.map(note => (
                  <div key={note.id} className="relative group">
                    {renamingId === note.id ? (
                      <div className="flex items-center gap-2 px-4 py-1.5">
                        <NoteIcon note={note} />
                        <input
                          ref={renameRef}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { updateNote(note.id, { title: renameValue }); setRenamingId(null) }
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          onBlur={() => { updateNote(note.id, { title: renameValue }); setRenamingId(null) }}
                          className="flex-1 text-sm bg-white border border-brown-300 rounded px-1.5 py-0.5 outline-none text-gray-900"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedNote(note.id)}
                        className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-left transition-colors ${
                          note.id === selectedNoteId
                            ? 'bg-gray-200/70 dark:bg-gray-800'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <NoteIcon note={note} />
                        <span className={`text-sm truncate flex-1 ${
                          note.id === selectedNoteId
                            ? 'text-gray-900 dark:text-gray-100 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {note.title || 'Untitled'}
                        </span>
                        <button
                          onClick={e => openMenu(e, note)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all flex-shrink-0"
                        >
                          <DotsThree className="w-4 h-4 text-gray-500" weight="bold" />
                        </button>
                      </button>
                    )}

                  </div>
                ))
              )}

              <div className="mx-3 border-t border-gray-200 dark:border-gray-800 my-2" />

              {/* Workspaces */}
              <div className="px-2">
                <button
                  onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                >
                  {workspacesExpanded ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />}
                  Workspaces
                </button>
                <AnimatePresence initial={false}>
                  {workspacesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <WorkspaceSection />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Trash */}
              <div className="px-2 mt-1">
                <button
                  onClick={e => setTrashAnchorY(e.currentTarget.getBoundingClientRect().top)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <TrashSimple className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">Trash</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className={`pb-3 pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center transition-all duration-250 ${c ? 'flex-col gap-1 px-1.5' : 'justify-between px-2'}`}>
        <button
          onClick={openSettings}
          title="Settings"
          className={`sidebar-item ${c ? 'w-full justify-center px-0' : 'flex-1'}`}
        >
          <GearSix className="w-5 h-5 text-black dark:text-white" />
          <FadeLabel show={!c}>Settings</FadeLabel>
        </button>
      </div>

      {/* Trash modal */}
      {trashAnchorY !== null && (
        <TrashModal anchorY={trashAnchorY} onClose={() => setTrashAnchorY(null)} />
      )}

      {/* Fixed context menu — renders outside overflow:hidden */}
      {menu && (() => {
        const note = allNotes[menu.noteId]
        if (!note) return null
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
            <div
              className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md py-2 w-56"
              style={{ top: menu.y, left: menu.x }}
            >
              {/* Header */}
              <div className="px-4 py-1.5 mb-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Note</p>
              </div>

              <button
                onClick={() => { updateNote(note.id, { favorite: !note.favorite }); setMenu(null) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
              >
                <Star className={`w-4 h-4 ${note.favorite ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`} weight={note.favorite ? 'fill' : 'regular'} />
                {note.favorite ? 'Remove from favourites' : 'Add to favourites'}
              </button>

              <button
                onClick={() => { updateNote(note.id, { pinned: !note.pinned }); setMenu(null) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
              >
                <PushPin className={`w-4 h-4 ${note.pinned ? 'text-brown-500' : 'text-gray-400 dark:text-gray-500'}`} weight={note.pinned ? 'fill' : 'regular'} />
                {note.pinned ? 'Unpin' : 'Pin'}
              </button>

              <button
                onClick={() => { setRenamingId(note.id); setRenameValue(note.title || ''); setMenu(null) }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
              >
                <PencilSimple className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Rename
              </button>

              {note.id !== GUIDE_NOTE_ID && (
                <>
                  <div className="mx-3 my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={() => { trashNote(note.id, true); setMenu(null) }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    Move to Trash
                  </button>
                </>
              )}
            </div>
          </>
        )
      })()}
    </div>
  )
}
