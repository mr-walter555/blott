export async function getAIStatus() {
  return window.electronAPI.ai.status()
}

export async function processText(action, text, { signal } = {}) {
  const { result, error } = await window.electronAPI.ai.processText(action, text)
  if (signal?.aborted) {
    const err = new Error('canceled')
    err.code = 'ERR_CANCELED'
    throw err
  }
  if (error) throw new Error(error)
  return result
}

// `notes` is the small, pre-ranked list of { id, title, excerpt } the caller
// judged relevant — the main process never sees the user's full note collection.
// `history` is prior { question, answer } turns from this conversation, used
// so follow-up questions are understood in context.
export async function askNotes(question, notes, history) {
  const { answer, citedIds, error } = await window.electronAPI.ai.askNotes(question, notes, history)
  if (error) throw new Error(error)
  return { answer, citedIds }
}
