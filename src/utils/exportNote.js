export function exportAsPDF(title, content) {
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Note'}</title><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 48px auto; padding: 0 32px; color: #111; line-height: 1.7; }
    h1 { font-size: 2em; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 28px 0 8px; }
    h3 { font-size: 1.2em; font-weight: 600; margin: 20px 0 6px; }
    p  { margin-bottom: 14px; }
    ul, ol { padding-left: 24px; margin-bottom: 14px; }
    li { margin-bottom: 4px; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre  { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 14px; }
    blockquote { border-left: 3px solid #ccc; padding-left: 16px; color: #555; font-style: italic; margin-bottom: 14px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    a  { color: #1a0dab; }
    @media print { body { margin: 0; padding: 24px 32px; } }
  </style></head><body>
  <h1>${title || 'Untitled'}</h1>
  ${content}
  </body></html>`)
  w.document.close()
  setTimeout(() => { w.print() }, 250)
}

export function exportAsMarkdown(title, content) {
  let md = content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis,        '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis,        '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis,        '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gis,        '#### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gis,          '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gis,        '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gis,          '*$1*')
    .replace(/<s[^>]*>(.*?)<\/s>/gis,          '~~$1~~')
    .replace(/<code[^>]*>(.*?)<\/code>/gis,    '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis,      '```\n$1\n```\n\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, '[$2]($1)')
    .replace(/<li[^>]*>\s*(?:<[^>]+>)?(.*?)(?:<\/[^>]+>)?\s*<\/li>/gis, '- $1\n')
    .replace(/<\/ul>\s*|<\/ol>\s*/gi,          '\n')
    .replace(/<ul[^>]*>|<ol[^>]*>/gi,          '')
    .replace(/<p[^>]*>(.*?)<\/p>/gis,          '$1\n\n')
    .replace(/<hr[^>]*>/gi,                    '\n---\n\n')
    .replace(/<br[^>]*>/gi,                    '\n')
    .replace(/<[^>]+>/g,                       '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const blob = new Blob([`# ${title || 'Untitled'}\n\n${md}`], { type: 'text/markdown;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${(title || 'note').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}
