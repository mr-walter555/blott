import { useState } from 'react'
import {
  FileText, Star, PushPin as PushPinRaw, Archive, Trash, GearSix,
  Plus, SidebarSimple, MagnifyingGlass, CaretDown, CaretRight, CalendarBlank
} from '@phosphor-icons/react'

const PushPin = (props) => <PushPinRaw {...props} style={{ ...props.style, transform: 'rotate(-45deg)' }} />
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import WorkspaceSection from './WorkspaceSection'

const NAV_ITEMS = [
  { id: 'all', label: 'All Notes', icon: FileText },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'pinned', label: 'Pinned', icon: PushPin },
  { id: 'archived', label: 'Archived', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash },
  { id: 'calendar', label: 'Calendar', icon: CalendarBlank },
]

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

export default function Sidebar() {
  const activeView = useUIStore(s => s.activeView)
  const activeWorkspaceId = useUIStore(s => s.activeWorkspaceId)
  const setActiveView = useUIStore(s => s.setActiveView)
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const openSettings = useUIStore(s => s.openSettings)
  const openCommandPalette = useUIStore(s => s.openCommandPalette)
  const createNote      = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const notes           = useNotesStore(s => s.notes)

  const [workspacesExpanded, setWorkspacesExpanded] = useState(true)

  const getCounts = (view) => {
    const all = Object.values(notes)
    if (view === 'all') return all.filter(n => !n.trashed && !n.archived).length
    if (view === 'favorites') return all.filter(n => n.favorite && !n.trashed && !n.archived).length
    if (view === 'pinned') return all.filter(n => n.pinned && !n.trashed && !n.archived).length
    if (view === 'archived') return all.filter(n => n.archived && !n.trashed).length
    if (view === 'trash') return all.filter(n => n.trashed).length
    return 0
  }

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
          className={`w-full flex items-center rounded-lg text-sm text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${c ? 'justify-center p-2' : 'gap-2 px-3 py-2'}`}
        >
          <MagnifyingGlass className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
          <FadeLabel show={!c} className="flex items-center flex-1 min-w-0">
            <span className="flex-1">Quick search…</span>
            <span className="text-xs opacity-50 font-mono">⌘K</span>
          </FadeLabel>
        </button>
      </div>

      <div className="mx-3 border-t border-gray-200 dark:border-gray-800 mb-1" />

      {/* Nav */}
      <nav className={`space-y-0.5 flex-1 overflow-y-auto transition-all duration-250 ${c ? 'px-1.5' : 'px-2'}`}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const count = getCounts(id)
          const isActive = activeView === id && !activeWorkspaceId
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              title={c ? label : undefined}
              className={`sidebar-item w-full ${isActive ? 'active' : ''} ${c ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 text-black dark:text-white" />
              <FadeLabel show={!c} className="flex-1 text-left">{label}</FadeLabel>
              {count > 0 && (
                <FadeLabel show={!c} className="text-xs text-gray-400 dark:text-gray-600 font-medium tabular-nums">
                  {count > 99 ? '99+' : count}
                </FadeLabel>
              )}
            </button>
          )
        })}

        {/* Workspaces */}
        <AnimatePresence initial={false}>
          {!c && (
            <motion.div
              key="workspaces"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="pt-2"
            >
              <button
                onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
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
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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
    </div>
  )
}
