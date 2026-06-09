import DOMPurify from 'dompurify'

// Notes are rendered as raw HTML (TipTap output) in places like shared pages
// and sticky notes. That HTML can come from sources we don't fully trust —
// e.g. a share link's content can be overwritten directly via the API, not
// just through the editor — so it must be sanitized before hitting the DOM.
export function sanitizeNoteHtml(html) {
  return DOMPurify.sanitize(html ?? '', { ADD_ATTR: ['target'] })
}
