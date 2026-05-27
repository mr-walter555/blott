import { useState, useEffect } from 'react'
import { CalendarBlank, Plus, ArrowSquareOut, PlugsConnected, Plugs, ArrowClockwise } from '@phosphor-icons/react'
import { getCalendarStatus, getAuthUrl, getEvents, disconnectCalendar } from '../services/calendarService'
import { useNotesStore } from '../store/notesStore'
import { useUIStore } from '../store/uiStore'

function groupByDay(events) {
  const groups = {}
  events.forEach(event => {
    const date = event.start?.dateTime || event.start?.date
    const day = new Date(date).toDateString()
    if (!groups[day]) groups[day] = []
    groups[day].push(event)
  })
  return Object.entries(groups)
}

function formatTime(dt) {
  if (!dt) return 'All day'
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function CalendarView() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const createNote      = useNotesStore(s => s.createNote)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const setActiveView   = useUIStore(s => s.setActiveView)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar') === 'connected') {
      window.history.replaceState({}, '', window.location.pathname)
      loadEvents()
    } else {
      checkStatus()
    }
  }, [])

  async function checkStatus() {
    setLoading(true)
    try {
      const { connected: c } = await getCalendarStatus()
      setConnected(c)
      if (c) await loadEvents(false)
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  async function loadEvents(showRefreshing = true) {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    try {
      const evts = await getEvents()
      setEvents(evts)
      setConnected(true)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  async function connect() {
    setConnecting(true)
    try {
      const { url } = await getAuthUrl()
      window.location.href = url
    } catch {
      setConnecting(false)
    }
  }

  async function disconnect() {
    await disconnectCalendar()
    setConnected(false)
    setEvents([])
  }

  async function takeNotes(event) {
    const startTime = event.start?.dateTime || event.start?.date
    const endTime   = event.end?.dateTime   || event.end?.date
    const attendees = event.attendees?.map(a => a.displayName || a.email).join(', ') || ''
    const dateStr   = startTime ? new Date(startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''

    const content = [
      `<h2>${event.summary || 'Meeting Notes'}</h2>`,
      `<p><strong>Date:</strong> ${dateStr}</p>`,
      attendees ? `<p><strong>Attendees:</strong> ${attendees}</p>` : '',
      event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : '',
      `<p><br></p>`,
    ].filter(Boolean).join('')

    const note = await createNote({
      title:           event.summary || 'Meeting Notes',
      content,
      calendarEventId: event.id,
      scheduledAt:     startTime || null,
    })
    setSelectedNote(note.id)
    setActiveView('all')
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  if (!connected) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <CalendarBlank className="w-8 h-8 text-blue-500" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900">Connect Google Calendar</p>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">See your upcoming events and create linked notes from them</p>
      </div>
      <button
        onClick={connect}
        disabled={connecting}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        <PlugsConnected className="w-4 h-4" />
        {connecting ? 'Connecting…' : 'Connect Google Calendar'}
      </button>
    </div>
  )

  const grouped = groupByDay(events)

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CalendarBlank className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">Calendar</h2>
          <span className="text-xs text-gray-400">Next 2 weeks</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadEvents()} disabled={refreshing}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors disabled:opacity-40"
            title="Refresh events">
            <ArrowClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={disconnect}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            title="Disconnect Google Calendar">
            <Plugs className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <CalendarBlank className="w-10 h-10 opacity-20" />
            <p className="text-sm">No upcoming events in the next 2 weeks</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, dayEvents]) => (
              <div key={day}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  {formatDayLabel(dayEvents[0].start?.dateTime || dayEvents[0].start?.date)}
                </p>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <div key={event.id}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                      <div className="w-1 self-stretch rounded-full bg-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.summary || '(No title)'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.start?.dateTime
                            ? `${formatTime(event.start.dateTime)} – ${formatTime(event.end?.dateTime)}`
                            : 'All day'}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{event.location}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => takeNotes(event)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-brown-600 hover:bg-brown-700 rounded-lg transition-colors">
                          <Plus className="w-3 h-3" />
                          Note
                        </button>
                        {event.htmlLink && (
                          <button onClick={() => window.open(event.htmlLink, '_blank')}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                            title="Open in Google Calendar">
                            <ArrowSquareOut className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
