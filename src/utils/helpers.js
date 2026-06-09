export function stripHtml(html) {
  if (!html) return ''
  // textContent both removes tags and decodes entities (&nbsp;, &amp;, etc.) —
  // a regex-only strip leaves entities as literal text (e.g. "&nbsp;&nbsp;…")
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent || ''
  return text.replace(/\s+/g, ' ').trim()
}

export function truncate(str, len = 120) {
  if (!str || str.length <= len) return str
  return str.slice(0, len).trimEnd() + '…'
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)

  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export function getWordCount(html) {
  const text = stripHtml(html)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function getCharCount(html) {
  return stripHtml(html).length
}
