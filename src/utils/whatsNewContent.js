// Short, hand-written HTML shown once in the in-app "What's new" modal after
// an update. Kept separate from the GitHub release notes, which are written
// for the releases page (download tables, SmartScreen instructions,
// contributor avatars) and aren't meant for a small in-app dialog.
//
// Update this alongside each release to describe what's new since the last
// version.
export const WHATS_NEW_HTML = `
<p>Here's what's new in this update:</p>
<ul>
  <li><strong>Global Quick Capture</strong> — press <code>Alt+Space</code> from anywhere to open a small popup and jot down a note instantly, even when Smart Notepad isn't focused</li>
  <li><strong>Ask AI</strong> now opens with <code>Ctrl+Q</code> instead of <code>Ctrl+Shift+A</code>, which could conflict with Windows' keyboard layout shortcut</li>
</ul>
`
