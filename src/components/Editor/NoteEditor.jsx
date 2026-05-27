import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)
import { useNotesStore } from '../../store/notesStore'
import { useUIStore } from '../../store/uiStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import EditorToolbar from './EditorToolbar'
import AIFloatingMenu from './AIFloatingMenu'
import NoteHeader from './NoteHeader'
import { getWordCount } from '../../utils/helpers'

const CODE_KEYWORDS = /\b(function|const|let|var|import|export|def|async|await|=>|interface|typeof|instanceof)\b/
const CODE_SYMBOLS = /[{};]|=>|::|->|&&|\|\||\/\//

function looksLikeCode(text) {
  const lines = text.split('\n')
  if (lines.length < 3) return false
  const hasIndent = lines.some(l => /^(\t| {2,})/.test(l))
  const hasCodeMarkers = CODE_KEYWORDS.test(text) || CODE_SYMBOLS.test(text)
  return hasIndent && hasCodeMarkers
}

export default function NoteEditor({ noteId }) {
  const note = useNotesStore(s => s.notes[noteId])
  const fontSize = useUIStore(s => s.fontSize)

  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [menuPos, setMenuPos] = useState(null)

  useAutoSave(noteId, content, title, note?.shareToken)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, history: { depth: 500, newGroupDelay: 300 } }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext', HTMLAttributes: { class: 'code-block' } }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'editor-image' } }),
      Placeholder.configure({ placeholder: 'Start writing… or right-click selected text for AI tools' }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      CharacterCount,
      TextStyle,
      Color,
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor ProseMirror min-h-full focus:outline-none',
        spellcheck: 'true',
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        if (!text || !looksLikeCode(text)) return false
        const { schema, tr, selection } = view.state
        const codeBlock = schema.nodes.codeBlock
        if (!codeBlock) return false
        const node = codeBlock.create({}, schema.text(text))
        view.dispatch(tr.replaceSelectionWith(node).scrollIntoView())
        return true
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!note) return
    setTitle(note.title || '')
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || '', false)
      setContent(note.content || '')
    }
  }, [noteId])

  useEffect(() => {
    if (editor) {
      const size = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px'
      editor.view.dom.style.fontSize = size
    }
  }, [editor, fontSize])

  useEffect(() => {
    if (!menuPos) return
    const close = () => setMenuPos(null)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menuPos])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
  }

  const handleContextMenu = (e) => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const hasSelection = from !== to && !editor.isActive('codeBlock')
    if (!hasSelection) return
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus('start') }
    if (e.key === 'ArrowDown') { e.preventDefault(); editor?.commands.focus('start') }
  }

  if (!note) return null

  const wordCount = getWordCount(content)
  const charCount = editor?.storage.characterCount?.characters() ?? 0

  return (
    <div className="flex h-full bg-white flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <NoteHeader note={note} editor={editor} />
        <EditorToolbar editor={editor} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              placeholder="Untitled"
              className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300 mb-4 resize-none leading-tight"
            />

            <div className="tiptap-editor" onContextMenu={handleContextMenu}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {menuPos && editor && (
          <div
            className="fixed z-50"
            style={{ top: menuPos.y, left: menuPos.x }}
            onMouseDown={e => e.stopPropagation()}
          >
            <AIFloatingMenu editor={editor} noteId={noteId} onClose={() => setMenuPos(null)} />
          </div>
        )}

        <div className="flex items-center justify-between px-8 py-2 border-t border-gray-100 text-xs text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
          <span>Auto-saved</span>
        </div>
      </div>
    </div>
  )
}
