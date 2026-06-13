import { useState } from 'react'
import {
  Trash, Archive,
  ArrowCounterClockwise, ArrowsOutSimple, FilePdf, FileText as FileMd, DotsThree, BookOpen
} from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useNotesStore } from '../../store/notesStore'
import { useUIStore } from '../../store/uiStore'
import { formatDate } from '../../utils/helpers'
import { exportAsPDF, exportAsMarkdown } from '../../utils/exportNote'
import { GUIDE_NOTE_ID } from '../../utils/guideNote'
import DeleteConfirmModal from '../Sidebar/DeleteConfirmModal'

export default function NoteHeader({ note, editor }) {
  const trashNote      = useNotesStore(s => s.trashNote)
  const restoreNote    = useNotesStore(s => s.restoreNote)
  const deleteNote     = useNotesStore(s => s.deleteNote)
  const archiveNote    = useNotesStore(s => s.archiveNote)
  const toggleFocusMode = useUIStore(s => s.toggleFocusMode)

  const [exportOpen, setExportOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteForever = () => {
    deleteNote(note.id)
    setConfirmDelete(false)
    toast.success('Note permanently deleted', { iconTheme: { primary: '#ef4444', secondary: '#fff' } })
  }

  return (
    <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
      <div className="flex items-center justify-between px-8 py-2.5">

        {/* Note title */}
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
          {note.title || 'Untitled'}
        </p>

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-600">Edited {formatDate(note.updatedAt)}</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {!note.trashed && (
            <>
              {/* Export dropdown */}
              <div className="relative">
                <button onClick={() => setExportOpen(o => !o)} className="btn-icon" title="More options" aria-label="More options">
                  <DotsThree className="w-5 h-5 text-black dark:text-white" weight="bold" />
                </button>
                {exportOpen && (
                  <div
                    className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden w-52"
                    onMouseLeave={() => setExportOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="section-label">Export</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { exportAsPDF(note.title, note.content); setExportOpen(false); toast.success('Exported as PDF') }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <FilePdf className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">Export as PDF</span>
                      </button>
                      <button
                        onClick={() => { exportAsMarkdown(note.title, note.content); setExportOpen(false); toast.success('Exported as Markdown') }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <FileMd className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">Export as Markdown</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={toggleFocusMode} className="btn-icon" title="Focus mode" aria-label="Focus mode">
                <ArrowsOutSimple className="w-5 h-5 text-black dark:text-white" />
              </button>
              <button
                onClick={() => {
                  archiveNote(note.id, !note.archived)
                  toast(note.archived ? 'Note unarchived' : 'Note archived', { icon: <Archive className="w-4 h-4 text-gray-500" /> })
                }}
                className="btn-icon"
                title={note.archived ? 'Unarchive' : 'Archive'}
                aria-label={note.archived ? 'Unarchive' : 'Archive'}
              >
                <Archive className={`w-5 h-5 ${note.archived ? 'text-brown-500' : 'text-black dark:text-white'}`} weight={note.archived ? 'fill' : 'regular'} />
              </button>
              {note.id === GUIDE_NOTE_ID ? (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 select-none" title="This guide cannot be deleted">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  Guide
                </span>
              ) : (
                <button onClick={() => { trashNote(note.id, true); toast('Moved to trash', { icon: '🗑️' }) }} className="btn-icon hover:text-red-500" title="Move to trash" aria-label="Move to trash">
                  <Trash className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Trash banner — note is read-only while trashed */}
      {note.trashed && (
        <div className="flex items-center justify-between gap-3 px-8 py-2 bg-gray-50 dark:bg-white/[0.03]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This note is in Trash and read-only. It'll be permanently deleted after 30 days.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { restoreNote(note.id); toast.success('Note restored') }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors"
            >
              <ArrowCounterClockwise className="w-3.5 h-3.5" />
              Restore
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash className="w-3.5 h-3.5" />
              Delete forever
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirmModal
            key="delete-confirm"
            note={note}
            onConfirm={handleDeleteForever}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
