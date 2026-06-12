import axios from 'axios'

import { API_URL } from '../config'
const BASE = `${API_URL}/api/ai`

const api = axios.create({ baseURL: BASE, timeout: 30000 })

export async function getAIStatus() {
  const { data } = await api.get('/status')
  return data
}

export async function processText(action, text, { signal } = {}) {
  const { data } = await api.post('/process', { action, text }, { signal })
  return data.result
}

// `notes` is the small, pre-ranked list of { id, title, excerpt } the caller
// judged relevant — the backend never sees the user's full note collection.
// `history` is prior { question, answer } turns from this conversation, used
// so follow-up questions are understood in context.
export async function askNotes(question, notes, history) {
  const { data } = await api.post('/ask', { question, notes, history })
  return data
}
