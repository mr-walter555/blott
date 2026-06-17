import { useRef, useEffect, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import Sidebar from '../components/Sidebar/Sidebar'
import NoteEditor from '../components/Editor/NoteEditor'
import { useUIStore } from '../store/uiStore'
import { useNotesStore } from '../store/notesStore'
import { Sparkle } from '@phosphor-icons/react'

const AI_SIDEBAR_WIDTH = 384 // px — matches w-96 / matches panel content width

export default function MainLayout() {
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed)
  const focusMode        = useUIStore(s => s.focusMode)
  const openAskAI        = useUIStore(s => s.openAskAI)
  const askAIOpen        = useUIStore(s => s.askAIOpen)
  const askAILayout      = useUIStore(s => s.askAILayout)
  const selectedNoteId   = useNotesStore(s => s.selectedNoteId)

  const sidebarRef  = useRef(null)
  const aiSlotRef   = useRef(null)
  const sparkleRef  = useRef(null)

  // ── Left sidebar ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!sidebarRef.current) return
    gsap.set(sidebarRef.current, {
      width:   focusMode ? 0 : sidebarCollapsed ? 56 : 260,
      opacity: focusMode ? 0 : 1,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sidebarRef.current) return
    gsap.to(sidebarRef.current, {
      width:     focusMode ? 0 : sidebarCollapsed ? 56 : 260,
      opacity:   focusMode ? 0 : 1,
      duration:  0.42,
      ease:      'power3.out',
      delay:     focusMode ? 0.04 : 0,
      overwrite: 'auto',
    })
  }, [sidebarCollapsed, focusMode])

  // ── AI sidebar slot ───────────────────────────────────────────────────
  const aiSidebarActive = askAIOpen && askAILayout === 'sidebar'

  useLayoutEffect(() => {
    if (!aiSlotRef.current) return
    gsap.set(aiSlotRef.current, { width: 0 })
  }, [])

  useEffect(() => {
    if (!aiSlotRef.current) return
    gsap.to(aiSlotRef.current, {
      width:     aiSidebarActive ? AI_SIDEBAR_WIDTH : 0,
      duration:  0.42,
      ease:      aiSidebarActive ? 'power3.out' : 'power3.inOut',
      overwrite: 'auto',
    })
  }, [aiSidebarActive])

  // ── FAB sparkle twinkle ───────────────────────────────────────────────
  useEffect(() => {
    if (!sparkleRef.current) return
    const tween = gsap.to(sparkleRef.current, {
      scale:    1.18,
      rotate:   15,
      duration: 1.1,
      ease:     'sine.inOut',
      yoyo:     true,
      repeat:   -1,
    })
    return () => tween.kill()
  }, [])

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Left sidebar */}
      <div
        ref={sidebarRef}
        className="flex-shrink-0 overflow-hidden"
        style={{ willChange: 'width' }}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AnimatePresence mode="wait">
          {selectedNoteId ? (
            <motion.div
              key={selectedNoteId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 flex overflow-hidden"
            >
              <NoteEditor noteId={selectedNoteId} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center flex-col gap-3 bg-white dark:bg-gray-950"
            >
              <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No note selected</p>
              <p className="text-xs text-gray-300 dark:text-gray-700">
                Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-medium">Ctrl+N</kbd>
                {' '}to create a new note
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI sidebar slot — GSAP animates width; AskAIModal portals content here */}
      <div
        id="ai-sidebar-slot"
        ref={aiSlotRef}
        className="flex-shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-800"
        style={{ willChange: 'width' }}
      />

      {/* FAB — opens "Ask your notes" (hidden when AI sidebar is open) */}
      {!focusMode && !aiSidebarActive && (
        <motion.button
          onClick={openAskAI}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 z-40 bg-brown-50 dark:bg-brown-950 rounded-full shadow-lg border border-brown-100 dark:border-brown-800 flex items-center justify-center hover:shadow-xl transition-shadow"
          style={{ width: 52, height: 52 }}
          title="Ask your notes (Ctrl+Shift+A)"
        >
          <span ref={sparkleRef} className="flex items-center justify-center">
            <Sparkle className="w-6 h-6 text-brown-500" weight="fill" />
          </span>
        </motion.button>
      )}
    </div>
  )
}
