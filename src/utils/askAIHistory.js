const STORAGE_KEY = 'sn_ask_ai_history'
const MAX_CONVERSATIONS = 50

function load() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_CONVERSATIONS)))
  } catch {}
}

export function loadConversations() {
  return load().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

// Creates the conversation on first save, then keeps overwriting the same
// entry as the thread grows — so a chat only appears in history once it has
// at least one exchange, and its title/order tracks the latest activity.
export function saveConversation({ id, thread }) {
  if (!thread.length) return loadConversations()

  const list = load()
  const idx = list.findIndex(c => c.id === id)
  const now = new Date().toISOString()
  const conversation = {
    id,
    title: thread[0].question,
    createdAt: idx >= 0 ? list[idx].createdAt : now,
    updatedAt: now,
    thread,
  }

  if (idx >= 0) list[idx] = conversation
  else list.unshift(conversation)

  persist(list)
  return loadConversations()
}

export function deleteConversation(id) {
  const list = load().filter(c => c.id !== id)
  persist(list)
  return loadConversations()
}
