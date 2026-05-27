import { useState } from 'react'
import {
  PushPin, Star, ArrowSquareOut, Trash,
  ArrowCounterClockwise, CalendarBlank, CalendarCheck, X
} from '@phosphor-icons/react'
import { useNotesStore } from '../../store/notesStore'
import ColorPicker from '../common/ColorPicker'
import { formatDate } from '../../utils/helpers'
import { createCalendarEvent, updateCalendarEvent } from '../../services/calendarService'

export default function NoteHeader({ note, editor }) {
  const updateNote   = useNotesStore(s => s.updateNote)
  const trashNote    = useNotesStore(s => s.trashNote)
  const restoreNote  = useNotesStore(s => s.restoreNote)
  const openAsFloating = useNotesStore(s => s.openAsFloating)

  const [showPicker, setShowPicker]   = useState(false)
  const [dateValue, setDateValue]     = useState('')
  const [scheduling, setScheduling]   = useState(false)
  const [scheduleErr, setScheduleErr] = useState('')

  function openPicker() {
    const existing = note.scheduledAt
      ? new Date(note.scheduledAt).toISOString().slice(0, 16)
      : ''
    setDateValue(existing)
    setScheduleErr('')
    setShowPicker(true)
  }

  async function handleSchedule() {
    if (!dateValue) return
    setScheduling(true)
    setScheduleErr('')
    try {
      const startTime = new Date(dateValue).toISOString()
      const endTime   = new Date(new Date(dateValue).getTime() + 60 * 60 * 1000).toISOString()
      const plainText = (note.content || '').replace(/<[^>]*>/g, '').slice(0, 500)

      if (note.calendarEventId) {
        await updateCalendarEvent(note.calendarEventId, {
          title: note.title || 'Untitled Note',
          description: plainText,
          startTime,
          endTime,
        })
        await updateNote(note.id, { scheduledAt: startTime })
      } else {
        const event = await createCalendarEvent({
          title: note.title || 'Untitled Note',
          description: plainText,
          startTime,
          endTime,
        })
        await updateNote(note.id, { calendarEventId: event.id, scheduledAt: startTime })
      }
      setShowPicker(false)
    } catch {
      setScheduleErr('Could not save to Calendar. Make sure you are connected.')
    } finally {
      setScheduling(false)
    }
  }

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

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-600">
            Edited {formatDate(note.updatedAt)}
          </span>
          {note.scheduledAt && (
            <span className="text-xs text-blue-500">
              {new Date(note.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
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
              {/* Calendar schedule button */}
              <div className="relative">
                <button
                  onClick={openPicker}
                  className="btn-icon"
                  title={note.scheduledAt ? 'Edit calendar event' : 'Schedule in Google Calendar'}
                >
                  {note.scheduledAt
                    ? <CalendarCheck className="w-5 h-5 text-blue-500" weight="fill" />
                    : <CalendarBlank className="w-5 h-5 text-black dark:text-white" />}
                </button>

                {showPicker && (
                  <div className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-72">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Schedule in Google Calendar</p>
                      <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="datetime-local"
                      value={dateValue}
                      onChange={e => setDateValue(e.target.value)}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {scheduleErr && (
                      <p className="text-xs text-red-500 mb-2">{scheduleErr}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSchedule}
                        disabled={scheduling || !dateValue}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        {scheduling ? 'Saving…' : note.calendarEventId ? 'Update Event' : 'Create Event'}
                      </button>
                      <button
                        onClick={() => setShowPicker(false)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
    </div>
  )
}
