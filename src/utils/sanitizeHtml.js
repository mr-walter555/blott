import DOMPurify from 'dompurify'

// Notes are rendered as raw HTML (TipTap output) in places like the What's
// New modal. That HTML can come from sources we don't fully trust — so it
// must be sanitized before hitting the DOM.
export function sanitizeNoteHtml(html) {
  return DOMPurify.sanitize(html ?? '', { ADD_ATTR: ['target'] })
}
