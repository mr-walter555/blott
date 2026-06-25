export const GUIDE_NOTE_ID = 'sn-getting-started'
export const GUIDE_NOTE_VERSION = 3

const GUIDE_CONTENT = `<p>👋 <strong>Welcome to Blott.</strong> Everything you write is encrypted and stays on your device — nothing ever leaves your machine.</p>
<p>Here are the basics:</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Click anywhere and just start typing</p></li>
  <li data-type="taskItem" data-checked="true"><p>Notes save <em>automatically</em> as you type — no save button needed</p></li>
  <li data-type="taskItem" data-checked="false"><p>Highlight any text and use the toolbar to <strong>style</strong> <em>your</em> <s>writing</s> <code>however</code> you <strong>like</strong></p></li>
  <li data-type="taskItem" data-checked="false"><p>Right-click selected text to use AI tools — improve, expand, summarise, translate</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Ctrl+N</code> to create a new note</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Ctrl+Q</code> to open <strong>Ask AI</strong> and chat with all your notes</p></li>
  <li data-type="taskItem" data-checked="false"><p>Press <code>Alt+Space</code> from anywhere to capture a thought instantly</p></li>
  <li data-type="taskItem" data-checked="false"><p>Create a <strong>Workspace</strong> in the sidebar to group related notes</p></li>
  <li data-type="taskItem" data-checked="false"><p>Open a note as a <strong>sticky note</strong> from the ··· menu to keep it floating on screen</p></li>
  <li data-type="taskItem" data-checked="false"><p>Every shortcut is listed in <strong>Settings → Shortcuts</strong> (<code>Ctrl+,</code>)</p></li>
</ul>`

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
