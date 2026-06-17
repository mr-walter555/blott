export const GUIDE_NOTE_ID = 'sn-getting-started'
export const GUIDE_NOTE_VERSION = 2

const SAMPLE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2ODAiIGhlaWdodD0iMjIwIiB2aWV3Qm94PSIwIDAgNjgwIDIyMCI+CiAgPHJlY3Qgd2lkdGg9IjY4MCIgaGVpZ2h0PSIyMjAiIHJ4PSIxMiIgZmlsbD0iI2Y1ZWZlOCIvPgogIDxyZWN0IHg9IjAiIHk9IjE0MCIgd2lkdGg9IjY4MCIgaGVpZ2h0PSI4MCIgZmlsbD0iI2U4ZGRkMCIvPgogIDxwb2x5Z29uIHBvaW50cz0iODAsMTQwIDIwMCw3MCAzMjAsMTQwIiBmaWxsPSIjZDRjNGIwIi8+CiAgPHBvbHlnb24gcG9pbnRzPSIyNjAsMTQwIDQwMCw1NSA1NDAsMTQwIiBmaWxsPSIjYzhiNDlhIi8+CiAgPGNpcmNsZSBjeD0iNTgwIiBjeT0iNjUiIHI9IjQyIiBmaWxsPSIjZjVkOWEwIi8+CiAgPHJlY3QgeD0iMCIgeT0iMjA4IiB3aWR0aD0iNjgwIiBoZWlnaHQ9IjEyIiBmaWxsPSIjZTBkNGM0Ii8+Cjwvc3ZnPg=='

const GUIDE_CONTENT = `<p>👋 <strong>Welcome to Smart Notepad.</strong> Everything you write is encrypted with <strong>AES-256-GCM</strong> and stays on your device — nothing ever leaves your machine. This note shows you what the editor can do.</p>

<h2>Text formatting</h2>
<p>Select any text to bring up the toolbar. You can make things <strong>bold</strong>, <em>italic</em>, <u>underlined</u>, or <s>struck through</s>. <mark>Highlight key ideas</mark>, drop in <code>inline code</code>, or add <span style="color: #b07d3a">colour</span> to make things stand out.</p>

<blockquote><p><strong>Tip —</strong> right-click any selected text for AI actions: improve writing, expand, summarise, or translate into another language.</p></blockquote>

<h2>Lists</h2>
<ul><li><p>Bullet lists for quick, unordered thoughts</p></li><li><p>Keep going as long as you need</p></li></ul>
<ol><li><p>Numbered lists for steps or ranked items</p></li><li><p>Where order actually matters</p></li></ol>

<h2>Code</h2>
<p>Paste code and Smart Notepad detects the language automatically. Or use the toolbar to wrap a selection in a block.</p>
<pre><code class="language-javascript">async function fetchNotes(userId) {
  const response = await fetch('/api/notes/' + userId)
  const notes = await response.json()
  return notes.filter(n => !n.trashed)
}</code></pre>

<h2>Images</h2>
<p>Paste or drag any image directly into a note — it embeds and encrypts alongside your text, no external links or cloud uploads.</p>
<img src="${SAMPLE_IMAGE}" alt="Example embedded image — paste or drag your own here">

<h2>Things to try</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Notes save <em>automatically</em> as you type — no save button needed</p></li>
  <li data-type="taskItem" data-checked="false"><p>Select the formatted text above and experiment with the toolbar</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Ctrl+N</code> to create a new note</p></li>
  <li data-type="taskItem" data-checked="false"><p>Right-click selected text and try an AI action</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Ctrl+Q</code> to open Ask AI and chat with your notes</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Alt+Space</code> from anywhere to capture a thought instantly</p></li>
  <li data-type="taskItem" data-checked="false"><p>Create a <strong>Workspace</strong> in the sidebar to group related notes</p></li>
</ul>

<hr>
<p>Every shortcut lives in <strong>Settings → Shortcuts</strong> (<code>Ctrl+,</code>). 🚀</p>`

export function makeGuideNote() {
  const now = new Date().toISOString()
  return {
    id: GUIDE_NOTE_ID,
    title: 'Getting Started',
    content: GUIDE_CONTENT,
    guideVersion: GUIDE_NOTE_VERSION,
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
