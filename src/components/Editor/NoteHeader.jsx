import {
  PushPin, Star, ArrowSquareOut, Trash,
  ArrowCounterClockwise, Lock, Globe, CaretUp
} from '@phosphor-icons/react'
import { useNotesStore } from '../../store/notesStore'
import { useUIStore } from '../../store/uiStore'
import ColorPicker from '../common/ColorPicker'
import { formatDate } from '../../utils/helpers'
import ShareModal from '../Share/ShareModal'

export default function NoteHeader({ note, editor, collaborators = [] }) {
  const updateNote = useNotesStore(s => s.updateNote)
  const trashNote = useNotesStore(s => s.trashNote)
  const restoreNote = useNotesStore(s => s.restoreNote)
  const openAsFloating = useNotesStore(s => s.openAsFloating)
  const shareModalOpen = useUIStore(s => s.shareModalOpen)
  const openShareModal = useUIStore(s => s.openShareModal)
  const closeShareModal = useUIStore(s => s.closeShareModal)

  return (
    <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
      <div className="flex items-center justify-between px-8 py-2.5">
        {/* Left actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateNote(note.id, { pinned: !note.pinned })}
            className={`btn-icon ${note.pinned ? 'text-brown-500' : ''}`}
            title={note.pinned ? 'Unpin' : 'Pin note'}
          >
            <PushPin className={`w-5 h-5 ${note.pinned ? 'fill-brown-500' : 'text-black dark:text-white'}`} weight={note.pinned ? 'fill' : 'regular'} style={{ transform: 'rotate(-45deg)' }} />
          </button>
          <button
            onClick={() => updateNote(note.id, { favorite: !note.favorite })}
            className={`btn-icon ${note.favorite ? 'text-yellow-400' : ''}`}
            title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="w-5 h-5" weight={note.favorite ? 'fill' : 'regular'} />
          </button>

          <ColorPicker
            value={note.color}
            onChange={color => updateNote(note.id, { color })}
          />
        </div>

        {/* Meta + Share */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-600">
            Edited {formatDate(note.updatedAt)}
          </span>
          {!note.trashed && (
            <button
              onClick={openShareModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                note.shareToken
                  ? 'border-brown-200 dark:border-brown-700 text-brown-600 dark:text-brown-400 bg-brown-50 dark:bg-brown-900/20 hover:bg-brown-100 dark:hover:bg-brown-900/40'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {note.shareToken
                ? <Globe className="w-4 h-4" />
                : <Lock className="w-4 h-4 text-black dark:text-white" />}
              Share
              <CaretUp className="w-3 h-3 opacity-50" />
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {note.trashed ? (
            <button
              onClick={() => restoreNote(note.id)}
              className="btn-icon text-green-500"
              title="Restore note"
            >
              <ArrowCounterClockwise className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => openAsFloating(note.id)}
                className="btn-icon"
                title="Open as floating sticky note"
              >
                <ArrowSquareOut className="w-5 h-5 text-black dark:text-white" />
              </button>
              <button
                onClick={() => trashNote(note.id, true)}
                className="btn-icon text-red-400 hover:text-red-500"
                title="Move to trash"
              >
                <Trash className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>


      {shareModalOpen && (
        <ShareModal note={note} onClose={closeShareModal} collaborators={collaborators} />
      )}
    </div>
  )
}