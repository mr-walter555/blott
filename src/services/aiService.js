import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const BASE = `${API_URL}/api/ai`

const api = axios.create({ baseURL: BASE, timeout: 30000 })

export async function processText(action, text) {
  const { data } = await api.post('/process', { action, text })
  return data.result
}

export async function detectTasks(content) {
  const { data } = await api.post('/detect-tasks', { content })
  return data
}

export async function generateInsights(content) {
  const { data } = await api.post('/insights', { content })
  return data
}
