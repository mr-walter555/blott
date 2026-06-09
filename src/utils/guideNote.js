export const GUIDE_NOTE_ID = 'sn-getting-started'

const GUIDE_CONTENT = `<h1>Welcome to Smart Notepad ✨</h1>
<p>Smart Notepad is an AI-powered note-taking workspace. This guide walks you through every feature — keep it as a reference anytime.</p>

<h2>Creating &amp; Managing Notes</h2>
<p>Click <strong>New Note</strong> in the sidebar or press <code>Ctrl+N</code> to create a note. Notes save automatically as you type.</p>
<ul>
  <li><strong>Pin</strong> — right-click a note in the sidebar and choose Pin to keep it at the top</li>
  <li><strong>Favourite</strong> — mark important notes with a star for quick access</li>
  <li><strong>Rename</strong> — right-click any note in the sidebar to rename it inline</li>
  <li><strong>Trash</strong> — move unwanted notes to Trash; they are permanently deleted after 30 days</li>
</ul>

<h2>Workspaces</h2>
<p>Organise your notes into <strong>Workspaces</strong> — like folders. Click a workspace in the sidebar to filter notes to that workspace, or expand the Workspaces section to create a new one.</p>

<h2>The Rich Text Editor</h2>
<p>Use the toolbar above the editor to format your writing:</p>
<ul>
  <li>Headings, <strong>bold</strong>, <em>italic</em>, underline, and strikethrough</li>
  <li>Bulleted lists, numbered lists, and <strong>checkboxes</strong> for task tracking</li>
  <li>Code blocks with syntax highlighting — paste code and it auto-detects the language</li>
  <li>Text alignment, links, highlights, and custom colours</li>
  <li>Paste images directly from your clipboard — they embed inline</li>
</ul>
<p>Use <strong>Focus Mode</strong> (the expand icon in the top-right of the editor) to hide the sidebar and write distraction-free. Press <code>Esc</code> to exit.</p>

<h2>AI Writing Tools</h2>
<p><strong>Select any text</strong> in a note and right-click to open the AI action menu. Options include:</p>
<ul>
  <li><strong>Improve writing</strong> — polish tone and clarity</li>
  <li><strong>Expand</strong> — add more detail to a passage</li>
  <li><strong>Summarise</strong> — condense selected content</li>
  <li><strong>Fix grammar</strong> — correct spelling and grammar errors</li>
  <li><strong>Translate</strong> — convert text to another language</li>
</ul>
<p>After the AI responds, you can <strong>Replace</strong> the original text, <strong>Insert below</strong>, or <strong>Discard</strong> the result.</p>

<h2>Ask Your Notes</h2>
<p>Press <code>Ctrl+Shift+A</code> or click the <strong>+</strong> button in the bottom-right corner to open the <strong>Ask your notes</strong> panel. Type any question and the AI will search across all your notes and answer with cited sources.</p>
<ul>
  <li>Use the <strong>layout toggle</strong> (rectangle icon in the panel header) to switch between <strong>Sidebar</strong>, <strong>Floating card</strong>, and <strong>Full screen</strong> — your preference is saved</li>
  <li>Click the <strong>clock icon</strong> to browse your full conversation history</li>
  <li>Click the <strong>+</strong> icon in the panel header to start a fresh conversation</li>
  <li>Use the suggestion chips at the bottom for quick prompts</li>
</ul>

<h2>Keyboard Shortcuts</h2>
<ul>
  <li><code>Ctrl+N</code> — New note</li>
  <li><code>Ctrl+S</code> — Save immediately</li>
  <li><code>Ctrl+F</code> — Search notes</li>
  <li><code>Ctrl+Shift+A</code> — Ask your notes (AI chat)</li>
  <li><code>Ctrl+Shift+P</code> — Command palette</li>
  <li><code>Ctrl+,</code> — Open settings</li>
  <li><code>Ctrl+B</code> / <code>Ctrl+I</code> / <code>Ctrl+U</code> — Bold / Italic / Underline</li>
  <li><code>Ctrl+Z</code> / <code>Ctrl+Shift+Z</code> — Undo / Redo</li>
  <li><code>Esc</code> — Close any open panel or modal</li>
</ul>
<p>The full list is always available in <strong>Settings → Shortcuts</strong>.</p>

<h2>Settings</h2>
<p>Open Settings with <code>Ctrl+,</code> or the gear icon at the bottom of the sidebar:</p>
<ul>
  <li><strong>Appearance</strong> — Light or Dark theme, font size, and font family</li>
  <li><strong>Auto-save</strong> — configure how frequently notes are saved</li>
  <li><strong>AI</strong> — manage your AI provider and model preferences</li>
  <li><strong>Shortcuts</strong> — full reference of all keyboard shortcuts</li>
</ul>

<p>This guide is always here for reference. Happy writing! 🚀</p>`

export function makeGuideNote() {
  const now = new Date().toISOString()
  return {
    id: GUIDE_NOTE_ID,
    title: 'Getting Started',
    content: GUIDE_CONTENT,
    color: 'default',
    pinned: true,
    favorite: false,
    archived: false,
    trashed: false,
    workspaceId: null,
    createdAt: now,
    updatedAt: now,
  }
}
