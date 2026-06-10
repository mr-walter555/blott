// Use [^*]+ to match bold/italic — avoids failures on newlines or special chars
function inlineMarkdown(str) {
  return str
    .replace(/\s*\[\d+\]/g, '')
    .replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g,          '<em>$1</em>')
    .replace(/`([^`]+?)`/g,            '<code>$1</code>')
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Converts AI-generated markdown-ish text (paragraphs, bullet/numbered lists,
// fenced code blocks, inline emphasis/code, [N] citations) into the HTML
// TipTap expects for note content.
export function markdownToHtml(text) {
  const html = []
  const codeFenceRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  function renderProse(segment) {
    return segment
      .split(/\n{2,}/)
      .map(para => {
        const line = para.trim()
        if (!line) return ''
        if (/^[-*•]\s/.test(line)) {
          const items = line.split('\n').map(l =>
            `<li>${inlineMarkdown(l.replace(/^[-*•]\s/, ''))}</li>`
          ).join('')
          return `<ul>${items}</ul>`
        }
        if (/^\d+\.\s/.test(line)) {
          const items = line.split('\n').map(l =>
            `<li>${inlineMarkdown(l.replace(/^\d+\.\s/, ''))}</li>`
          ).join('')
          return `<ol>${items}</ol>`
        }
        return `<p>${inlineMarkdown(line.replace(/\n/g, '<br/>'))}</p>`
      })
      .filter(Boolean)
      .join('')
  }

  while ((match = codeFenceRegex.exec(text))) {
    if (match.index > lastIndex) html.push(renderProse(text.slice(lastIndex, match.index)))
    const [, language, code] = match
    const cls = language ? ` class="language-${language}"` : ''
    html.push(`<pre><code${cls}>${escapeHTML(code.replace(/\n$/, ''))}</code></pre>`)
    lastIndex = codeFenceRegex.lastIndex
  }
  if (lastIndex < text.length) html.push(renderProse(text.slice(lastIndex)))

  return html.join('')
}
