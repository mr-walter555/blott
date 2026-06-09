import { useState, useRef } from 'react'
import { PushPin as PushPinRaw, Star, DotsThree, Trash, Archive, ArrowSquareOut, ArrowCounterClockwise } from '@phosphor-icons/react'
import DropdownMenu from '../common/DropdownMenu'

const PushPin = (props) => <PushPinRaw {...props} style={{ ...props.style, transform: 'rotate(-45deg)' }} />
import { useNotesStore } from '../../store/notesStore'
import { useUIStore } from '../../store/uiStore'
import { stripHtml, truncate, formatDate } from '../../utils/helpers'
import { getColorClasses, NOTE_COLORS } from '../../utils/noteColors'

export default function NoteCard({ note, selected, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuTriggerRef = useRef(null)

  const updateNote = useNotesStore(s => s.updateNote)
  const trashNote = useNotesStore(s => s.trashNote)
  const restoreNote = useNotesStore(s => s.restoreNote)
  const deleteNote = useNotesStore(s => s.deleteNote)
  const archiveNote = useNotesStore(s => s.archiveNote)
  const openAsFloating = useNotesStore(s => s.openAsFloating)
  const activeView = useUIStore(s => s.activeView)

  const preview = truncate(stripHtml(note.content), 100)
  const colorClasses = getColorClasses(note.color)

  const handleMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const isTrash = activeView === 'trash'

  return (
    <div
      onClick={onClick}
      className={`note-card ${selected ? 'selected' : ''} ${colorClasses} group`}
    >
      {/* Pin & favorite indicators */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-snug flex-1">
          {note.title || <span className="text-gray-400 dark:text-gray-600 font-normal italic">Untitled</span>}
        </h3>

        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button ref={menuTriggerRef} onClick={handleMenu} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <DotsThree className="w-4 h-4 text-black dark:text-white" weight="bold" />
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
          {preview}
        </p>
      )}

      {/* Date */}
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">{formatDate(note.updatedAt)}</p>

      {/* Context menu */}
      <DropdownMenu
        anchor={menuTriggerRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        align="right"
      >
        <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 w-44">
          {isTrash ? (
            <>
              <MenuItem icon={ArrowCounterClockwise} label="Restore" onClick={() => { restoreNote(note.id); setMenuOpen(false) }} />
              <MenuItem icon={Trash} label="Delete Forever" danger onClick={() => { deleteNote(note.id); setMenuOpen(false) }} />
            </>
          ) : (
            <>
              <MenuItem icon={ArrowSquareOut} label="Open as Sticky" onClick={() => { openAsFloating(note.id); setMenuOpen(false) }} />
              <MenuItem
                icon={PushPin}
                label={note.pinned ? 'Unpin' : 'Pin note'}
                onClick={() => { updateNote(note.id, { pinned: !note.pinned }); setMenuOpen(false) }}
              />
              <MenuItem
                icon={Star}
                label={note.favorite ? 'Remove favorite' : 'Add to favorites'}
                onClick={() => { updateNote(note.id, { favorite: !note.favorite }); setMenuOpen(false) }}
              />
              <div className="mx-2 my-1 border-t border-gray-100 dark:border-gray-700" />
              <MenuItem
                icon={Archive}
                label={note.archived ? 'Unarchive' : 'Archive'}
                onClick={() => { archiveNote(note.id, !note.archived); setMenuOpen(false) }}
              />
              <MenuItem icon={Trash} label="Move to trash" danger onClick={() => { trashNote(note.id, true); setMenuOpen(false) }} />
            </>
          )}
        </div>
      </DropdownMenu>
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}