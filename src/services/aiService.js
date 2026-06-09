import axios from 'axios'

import { API_URL } from '../config'
const BASE = `${API_URL}/api/ai`

const api = axios.create({ baseURL: BASE, timeout: 30000 })

export async function processText(action, text) {
  const { data } = await api.post('/process', { action, text })
  return data.result
}

// `notes` is the small, pre-ranked list of { id, title, excerpt } the caller
// judged relevant — the backend never sees the user's full note collection.
export async function askNotes(question, notes) {
  const { data } = await api.post('/ask', { question, notes })
  return data
}
