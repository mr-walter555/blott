// editorProps.handleClick for Tiptap editors. The Link extension is configured
// with openOnClick: false so a plain click places the cursor for editing;
// Ctrl/Cmd+click instead opens the link via window.open(), which Electron's
// navigation hardening (setWindowOpenHandler) routes to the system browser.
export function handleLinkClick(_view, _pos, event) {
  if (!(event.ctrlKey || event.metaKey)) return false
  const link = event.target.closest?.('a[href]')
  if (!link) return false
  event.preventDefault()
  window.open(link.href, '_blank')
  return true
}
