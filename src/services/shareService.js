import { API_URL } from '../config'
const BASE = `${API_URL}/api/share`

export async function syncShare(token, { title, content }) {
  try {
    await fetch(`${BASE}/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
  } catch {}
}
