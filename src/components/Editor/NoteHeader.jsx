import { useState } from 'react'
import {
  ArrowSquareOut, Trash,
  ArrowCounterClockwise, ArrowsOutSimple, FilePdf, FileText as FileMd, DotsThree, BookOpen
} from '@phosphor-icons/react'
import { useNotesStore } from '../../store/notesStore'
import { useUIStore } from '../../store/uiStore'
import { formatDate } from '../../utils/helpers'
import { exportAsPDF, exportAsMarkdown } from '../../utils/exportNote'
import { GUIDE_NOTE_ID } from '../../utils/guideNote'

export default function NoteHeader({ note, editor }) {
  const trashNote      = useNotesStore(s => s.trashNote)
  const restoreNote    = useNotesStore(s => s.restoreNote)
  const openAsFloating = useNotesStore(s => s.openAsFloating)
  const toggleFocusMode = useUIStore(s => s.toggleFocusMode)

  const [exportOpen, setExportOpen] = useState(false)

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
          {note.trashed ? (
            <button onClick={() => restoreNote(note.id)} className="btn-icon text-green-500" title="Restore note">
              <ArrowCounterClockwise className="w-5 h-5" />
            </button>
          ) : (
            <>
              {/* Export dropdown */}
              <div className="relative">
                <button onClick={() => setExportOpen(o => !o)} className="btn-icon" title="More options">
                  <DotsThree className="w-5 h-5 text-black dark:text-white" weight="bold" />
                </button>
                {exportOpen && (
                  <div
                    className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden w-52"
                    onMouseLeave={() => setExportOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Export</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { exportAsPDF(note.title, note.content); setExportOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <FilePdf className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">Export as PDF</span>
                      </button>
                      <button
                        onClick={() => { exportAsMarkdown(note.title, note.content); setExportOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <FileMd className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">Export as Markdown</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                      <button
                        onClick={() => { openAsFloating(note.id); setExportOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <ArrowSquareOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="whitespace-nowrap">Open as sticky note</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={toggleFocusMode} className="btn-icon" title="Focus mode">
                <ArrowsOutSimple className="w-5 h-5 text-black dark:text-white" />
              </button>
              {note.id === GUIDE_NOTE_ID ? (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 select-none" title="This guide cannot be deleted">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  Guide
                </span>
              ) : (
                <button onClick={() => trashNote(note.id, true)} className="btn-icon hover:text-red-500" title="Move to trash">
                  <Trash className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
