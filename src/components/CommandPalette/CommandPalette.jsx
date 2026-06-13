import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  MagnifyingGlass, FileText, Plus, Star, PushPin as PushPinRaw, Archive, Trash,
  GearSix, Sun, Moon, Desktop, Sparkle, ArrowSquareOut
} from '@phosphor-icons/react'

const PushPin = (props) => <PushPinRaw {...props} style={{ ...props.style, transform: 'rotate(-45deg)' }} />
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import { stripHtml } from '../../utils/helpers'
import { MODAL_BACKDROP, MODAL_CONTENT } from '../../utils/motionPresets'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import EmptyState from '../common/EmptyState'

const STATIC_COMMAND_DEFS = [
  { id: 'new-note',        label: 'New Note',      icon: Plus,     category: 'Actions'  },
  { id: 'ask-ai',          label: 'Ask your notes', icon: Sparkle, category: 'Actions'  },
  { id: 'view-all',        label: 'All Notes',     icon: FileText, category: 'Navigate' },
  { id: 'view-favorites',  label: 'Favorites',     icon: Star,     category: 'Navigate' },
  { id: 'view-pinned',     label: 'Pinned',        icon: PushPin,  category: 'Navigate' },
  { id: 'view-archived',   label: 'Archived',      icon: Archive,  category: 'Navigate' },
  { id: 'view-trash',      label: 'Trash',         icon: Trash,    category: 'Navigate' },
  { id: 'settings',        label: 'Open Settings', icon: GearSix,  category: 'Actions'  },
  { id: 'theme-light',     label: 'Light Theme',   icon: Sun,      category: 'Theme'    },
  { id: 'theme-dark',      label: 'Dark Theme',    icon: Moon,     category: 'Theme'    },
  { id: 'theme-system',    label: 'System Theme',  icon: Desktop,  category: 'Theme'    },
]

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const dialogRef = useFocusTrap()

  const closeCommandPalette = useUIStore(s => s.closeCommandPalette)
  const openNotesList = useUIStore(s => s.openNotesList)
  const openSettings = useUIStore(s => s.openSettings)
  const openAskAI = useUIStore(s => s.openAskAI)
  const setTheme = useUIStore(s => s.setTheme)
  const createNote = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const notes = useNotesStore(s => s.notes)

  const STATIC_COMMANDS = useMemo(() => STATIC_COMMAND_DEFS.map(def => ({
    ...def,
    action: def.id === 'new-note'       ? async () => { const n = await createNote(); setSelectedNote(n.id) }
          : def.id === 'view-all'       ? () => openNotesList('all')
          : def.id === 'view-favorites' ? () => openNotesList('favorites')
          : def.id === 'view-pinned'    ? () => openNotesList('pinned')
          : def.id === 'view-archived'  ? () => openNotesList('archived')
          : def.id === 'view-trash'     ? () => openNotesList('trash')
          : def.id === 'ask-ai'         ? () => openAskAI()
          : def.id === 'settings'       ? () => openSettings()
          : def.id === 'theme-light'    ? () => setTheme('light')
          : def.id === 'theme-dark'     ? () => setTheme('dark')
          : /* theme-system */            () => setTheme('system'),
  })), [createNote, setSelectedNote, openNotesList, openSettings, openAskAI, setTheme])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const noteResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return Object.values(notes)
      .filter(n => !n.trashed && (
        n.title?.toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q)
      ))
      .slice(0, 5)
      .map(n => ({
        id: `note-${n.id}`,
        label: n.title || 'Untitled',
        description: stripHtml(n.content).slice(0, 60),
        icon: FileText,
        category: 'Notes',
        action: () => setSelectedNote(n.id),
      }))
  }, [query, notes])

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return STATIC_COMMANDS
    const q = query.toLowerCase()
    return STATIC_COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
  }, [query, STATIC_COMMANDS])

  const allItems = [...noteResults, ...filteredCommands]

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const execute = (item) => {
    item.action()
    closeCommandPalette()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      execute(allItems[selectedIndex])
    } else if (e.key === 'Escape') {
      closeCommandPalette()
    }
  }

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const groups = allItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  let globalIndex = 0

  return (
    <>
      <motion.div
        {...MODAL_BACKDROP}
        onClick={closeCommandPalette}
        className="fixed inset-0 z-50 bg-black/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        {...MODAL_CONTENT}
        className="w-full max-w-xl pointer-events-auto"
      >
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Command palette" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <MagnifyingGlass className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search notes, commands…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[32rem] overflow-y-auto py-2">
            {allItems.length === 0 ? (
              <EmptyState message="No results" className="py-6" />
            ) : (
              Object.entries(groups).map(([category, items]) => (
                <div key={category}>
                  <p className="px-4 py-1.5 section-label">
                    {category}
                  </p>
                  {items.map(item => {
                    const idx = globalIndex++
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={item.id}
                        onClick={() => execute(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                          isSelected
                            ? 'bg-brown-50 dark:bg-brown-950/40 text-brown-600 dark:text-brown-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0 text-black dark:text-white" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
            </div>
            {query.trim() && noteResults.length > 0 && (
              <span className="tabular-nums">{noteResults.length} note{noteResults.length !== 1 ? 's' : ''} found</span>
            )}
          </div>
        </div>
      </motion.div>
      </div>
    </>
  )
}