const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const BASE = `${API_URL}/api/calendar`

export async function getCalendarStatus() {
  const res = await fetch(`${BASE}/status`)
  return res.json()
}

export async function getAuthUrl() {
  const res = await fetch(`${BASE}/auth`)
  if (!res.ok) throw new Error('Failed to get auth URL')
  return res.json()
}

export async function getEvents() {
  const res = await fetch(`${BASE}/events`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function createCalendarEvent({ title, description, startTime, endTime }) {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, startTime, endTime }),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function updateCalendarEvent(eventId, data) {
  const res = await fetch(`${BASE}/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update event')
  return res.json()
}

export async function deleteCalendarEvent(eventId) {
  await fetch(`${BASE}/events/${eventId}`, { method: 'DELETE' })
}

export async function disconnectCalendar() {
  await fetch(`${BASE}/disconnect`, { method: 'POST' })
}
