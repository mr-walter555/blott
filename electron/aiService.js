const OpenAI = require('openai')

let client = null
let cachedKey = null

// Re-creates the client whenever the stored API key changes, so updating the
// key in Settings takes effect on the next AI call without restarting anything.
function getClient(apiKey) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')
  if (!client || cachedKey !== apiKey) {
    client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/mr-walter555/smart-notepad',
        'X-Title': 'Smart Notepad',
      },
    })
    cachedKey = apiKey
  }
  return client
}

const MODEL = 'openai/gpt-4o-mini'

const SYSTEM_PROMPT = 'You are a helpful writing assistant integrated into a note-taking application. Be concise and precise. Return only the transformed text without explanation unless asked.'

const ACTION_PROMPTS = {
  summarize: 'Summarize the following text concisely, capturing the key points:\n\n',
  rewrite: 'Rewrite the following text in a clear, professional tone while preserving all information:\n\n',
  grammar: 'Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n',
  bullets: 'Convert the following text into a clean, well-organized bullet-point list:\n\n',
  actions: 'Extract all action items and tasks from the following text as a numbered list. If none exist, state "No action items found.":\n\n',
  expand: 'Expand the following text with more detail, examples, and elaboration:\n\n',
  simplify: 'Simplify the following text to be clearer and easier to understand:\n\n',
}

async function processText(apiKey, action, text) {
  const openai = getClient(apiKey)
  const prompt = ACTION_PROMPTS[action]
  if (!prompt) throw new Error(`Unknown AI action: ${action}`)

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt + text },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

// Notes only carry an absolute `updatedAt` timestamp; the model has no
// clock of its own, so date-scoped questions ("this week", "yesterday")
// are unanswerable unless both the note dates and today's date are given.
function formatNoteDate(updatedAt) {
  return updatedAt ? updatedAt.slice(0, 10) : 'unknown date'
}

async function askNotes(apiKey, question, notes = [], history = []) {
  const openai = getClient(apiKey)

  const today = new Date().toISOString().slice(0, 10)

  const context = notes.length
    ? notes.map((n, i) => `[${i + 1}] ${n.title} (last updated ${formatNoteDate(n.updatedAt)})\n${n.excerpt}`).join('\n\n')
    : '(No notes were found that relate to this question.)'

  // History entries are prior turns of this conversation, included so
  // follow-up questions ("what about X?") are understood in context.
  // Citation markers from earlier turns are stripped since [N] numbering
  // is local to each turn's sources and would be misleading here.
  const historyMessages = history
    .filter(h => h?.question && h?.answer)
    .slice(-6)
    .flatMap(h => [
      { role: 'user', content: h.question },
      { role: 'assistant', content: h.answer.replace(/\s*\[\d+\]/g, '') },
    ])

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that answers questions using only the numbered notes provided as sources. Today's date is ${today}. Each source is labeled with the date it was last updated — use these dates to answer date-scoped questions (e.g. "this week", "yesterday", "last month"). Cite sources inline using [N], where N matches the source number. Within source text, "[ ]" marks an unfinished checklist item and "[x]" marks a completed one — these are unrelated to the [N] citation format. If the notes do not contain the answer, say so honestly instead of making things up. Use the prior conversation for context on follow-up questions, but base factual claims only on the current sources.`,
      },
      ...historyMessages,
      {
        role: 'user',
        content: `Sources:\n${context}\n\nQuestion: ${question}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.4,
  })

  const answer = response.choices[0]?.message?.content?.trim() || ''
  const citedIds = [...new Set([...answer.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1])))]
    .map(n => notes[n - 1]?.id)
    .filter(Boolean)

  return { answer, citedIds }
}

module.exports = { processText, askNotes }
