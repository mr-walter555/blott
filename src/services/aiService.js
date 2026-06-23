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

// Streaming variant — `onToken` is called with each text chunk as it arrives.
// Returns a Promise that resolves to { citedIds } when the stream completes.
export function askNotesStream(question, notes, history, onToken) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID()
    const cleanupToken = window.electronAPI.ai.onStreamToken(requestId, onToken)
    const cleanupDone = window.electronAPI.ai.onStreamDone(requestId, ({ citedIds }) => {
      cleanup()
      resolve({ citedIds })
    })
    const cleanupError = window.electronAPI.ai.onStreamError(requestId, (error) => {
      cleanup()
      reject(new Error(error))
    })
    function cleanup() {
      cleanupToken()
      cleanupDone()
      cleanupError()
    }
    window.electronAPI.ai.askNotesStream(requestId, question, notes, history)
  })
}
