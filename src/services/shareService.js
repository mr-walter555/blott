const BASE = 'http://localhost:3001/api/share'

export async function createShare({ noteId, title, content, token }) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId, title, content, token }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status}`)
  }
  return res.json()
}

export async function syncShare(token, { title, content }) {
  try {
    await fetch(`${BASE}/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
  } catch {}
}

export async function deleteShare(token) {
  await fetch(`${BASE}/${token}`, { method: 'DELETE' })
}

export async function getShareInfo(token) {
  const res = await fetch(`${BASE}/${token}/info`)
  if (!res.ok) return null
  return res.json()
}

export const sharePageUrl = (token) => `http://localhost:3001/api/share/page/${token}`

export async function createInvite({ noteId, shareToken, email, permissions = 'view', noteTitle }) {
  const res = await fetch('http://localhost:3001/api/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId, shareToken, email, permissions, noteTitle }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status}`)
  }
  return res.json() // { token, inviteUrl, email }
}
