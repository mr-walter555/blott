import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar/Sidebar'
import NotesList from '../components/Notes/NotesList'
import NoteEditor from '../components/Editor/NoteEditor'
import CalendarView from './CalendarView'
import { useUIStore } from '../store/uiStore'
import { useNotesStore } from '../store/notesStore'

export default function MainLayout() {
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const activeView = useUIStore(s => s.activeView)
  const selectedNoteId = useNotesStore(s => s.selectedNoteId)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 56 : 220 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex-shrink-0 overflow-hidden"
      >
        <Sidebar />
      </motion.div>

      {activeView === 'calendar' ? (
        <div className="flex-1 flex overflow-hidden">
          <CalendarView />
        </div>
      ) : (
        <>
          {/* Notes List */}
          <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
            <NotesList />
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedNoteId ? (
                <motion.div
                  key={selectedNoteId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex overflow-hidden"
                >
                  <NoteEditor noteId={selectedNoteId} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center flex-col gap-4 text-gray-400"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                    📝
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Select a note or</p>
                    <p className="text-xs text-gray-400 mt-1">
                      press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+N</kbd> to create one
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
