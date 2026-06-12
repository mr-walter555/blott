export const GUIDE_NOTE_ID = 'sn-getting-started'

const GUIDE_CONTENT = `<p>👋 Welcome to Smart Notepad! Everything you write is encrypted with <strong>AES-256-GCM</strong> and stays on your device — nothing ever leaves your machine.</p>
<p>Here are the basics:</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>This note is pinned to the top of your sidebar for quick reference</p></li>
  <li data-type="taskItem" data-checked="true"><p>Your notes save <em>automatically</em> as you type — no save button needed</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Ctrl+N</code> to create a new note</p></li>
  <li data-type="taskItem" data-checked="false"><p>Highlight any text to <strong>style</strong> <em>your</em> writing, add a <mark>highlight</mark>, or <u>underline</u></p></li>
  <li data-type="taskItem" data-checked="false"><p>Right-click selected text for AI tools — improve, expand, summarise, or translate</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Ctrl+Shift+A</code> to open <mark>Ask AI</mark> and ask questions about everything you've written</p></li>
  <li data-type="taskItem" data-checked="false"><p>Create a <strong>Workspace</strong> from the sidebar to group related notes together</p></li>
</ul>
<hr>
<p>Every keyboard shortcut is listed in <strong>Settings → Shortcuts</strong> (<code>Ctrl+,</code>). 🚀</p>`

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
