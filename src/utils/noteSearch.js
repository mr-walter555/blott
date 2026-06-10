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

// Word-boundary match count — short terms like "ai" or "no" are substrings of
// many unrelated words ("again", "maintain", "know", "notes"), so a plain
// `.includes()`/`.split()` count would treat almost every note as a match.
function countMatches(text, term) {
  return (text.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length
}

function byRecency(notes, topK) {
  return [...notes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, topK)
    .map(note => ({
      id: note.id,
      title: note.title || 'Untitled',
      excerpt: truncate(stripHtml(note.content || ''), 800),
    }))
}

// Ranks notes by relevance to a natural-language question using plain term
// overlap (title hits weighted higher than body hits). No embeddings/vector
// store needed — note content lives locally (and encrypted at rest), so
// retrieval has to happen here before anything is sent to the AI backend.
//
// "Meta" questions like "what have I written lately?" share no keywords with
// note content, so term matching alone returns nothing — fall back to the
// most recently edited notes so the AI still has something to work with.
export function rankNotesByRelevance(question, notes, topK = 6) {
  const queryTerms = [...new Set(tokenize(question))]
  if (!queryTerms.length) return byRecency(notes, topK)

  const scored = notes.map(note => {
    const title = (note.title || '').toLowerCase()
    const body = stripHtml(note.content || '').toLowerCase()
    let score = 0

    for (const term of queryTerms) {
      if (countMatches(title, term) > 0) score += 3
      score += Math.min(countMatches(body, term), 5)
    }

    return { note, score, body }
  })

  const matched = scored.filter(s => s.score > 0)
  if (!matched.length) return byRecency(notes, topK)

  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ note, body }) => ({
      id: note.id,
      title: note.title || 'Untitled',
      excerpt: truncate(body, 800),
    }))
}
