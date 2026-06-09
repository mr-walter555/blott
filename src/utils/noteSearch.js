import { stripHtml, truncate } from './helpers'

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'am',
  'do', 'does', 'did', 'have', 'has', 'had', 'and', 'or', 'but', 'so',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'as', 'by',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'me',
  'what', 'when', 'where', 'who', 'why', 'how', 'did', 'does', 'do',
])

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w => w.length > 1 && !STOPWORDS.has(w))
}

// Ranks notes by relevance to a natural-language question using plain term
// overlap (title hits weighted higher than body hits). No embeddings/vector
// store needed — note content lives locally (and encrypted at rest), so
// retrieval has to happen here before anything is sent to the AI backend.
export function rankNotesByRelevance(question, notes, topK = 6) {
  const queryTerms = [...new Set(tokenize(question))]
  if (!queryTerms.length) return []

  const scored = notes.map(note => {
    const title = (note.title || '').toLowerCase()
    const body = stripHtml(note.content || '').toLowerCase()
    let score = 0

    for (const term of queryTerms) {
      if (title.includes(term)) score += 3
      const bodyMatches = body.split(term).length - 1
      score += Math.min(bodyMatches, 5)
    }

    return { note, score, body }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ note, body }) => ({
      id: note.id,
      title: note.title || 'Untitled',
      excerpt: truncate(body, 800),
    }))
}
