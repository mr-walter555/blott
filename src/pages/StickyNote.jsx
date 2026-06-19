import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import ResizableImage from '../components/Editor/extensions/ResizableImage'
import { X, Minus, CaretDown, PencilSimple, Palette } from '@phosphor-icons/react'
import { useNotesStore } from '../store/notesStore'
import { useTheme } from '../hooks/useTheme'
import { NOTE_COLORS } from '../utils/noteColors'
import { formatDate } from '../utils/helpers'
import { handleLinkClick } from '../utils/handleLinkClick'

const lowlight = createLowlight(common)

const CODE_KEYWORDS = /\b(function|const|let|var|import|export|def|async|await|=>|interface|typeof|instanceof)\b/
const CODE_SYMBOLS = /[{};]|=>|::|->|&&|\|\||\/\//

function looksLikeCode(text) {
  const lines = text.split('\n')
  if (lines.length < 3) return false
  const hasIndent = lines.some(l => /^(\t| {2,})/.test(l))
  const hasCodeMarkers = CODE_KEYWORDS.test(text) || CODE_SYMBOLS.test(text)
  return hasIndent && hasCodeMarkers
}

export default function StickyNote({ noteId }) {
  useTheme()

  const note = useNotesStore(s => s.notes[noteId])
  const initNotes = useNotesStore(s => s.init)
  const updateNote = useNotesStore(s => s.updateNote)
  const addNoteFromExternal = useNotesStore(s => s.addNoteFromExternal)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedHeight, setExpandedHeight] = useState(320)

  const HEADER_HEIGHT = 64

  useEffect(() => {
    initNotes()
  }, [])

  // The window is frameless+transparent so only the rounded card should be
  // visible; without this, index.css's `body` background paints the square
  // window rect, showing as dark "tips" in the corners outside the rounded card.
  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
  }, [])

  // Keeps `note` (color, updatedAt, etc.) fresh if it's edited from the main window.
  useEffect(() => {
    if (!window.electronAPI?.onNoteUpdated) return
    return window.electronAPI.onNoteUpdated((updated) => {
      if (updated.id === noteId) addNoteFromExternal(updated)
    })
  }, [noteId, addNoteFromExternal])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, history: { depth: 500, newGroupDelay: 300 }, code: { HTMLAttributes: { spellcheck: 'false' } } }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext', HTMLAttributes: { class: 'code-block' } }),
      ResizableImage.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'editor-image' } }),
      Placeholder.configure({ placeholder: 'Take a note…' }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor ProseMirror min-h-full focus:outline-none',
        spellcheck: 'true',
      },
      handleClick: handleLinkClick,
      handlePaste: (view, event) => {
        const imageFiles = Array.from(event.clipboardData?.items || [])
          .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
          .map(item => item.getAsFile())
          .filter(Boolean)

        if (imageFiles.length) {
          event.preventDefault()
          imageFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
              editor?.chain().focus().insertContent([
                { type: 'image', attrs: { src: reader.result, alt: file.name || 'pasted-image' } },
                { type: 'paragraph' },
              ]).run()
            }
            reader.readAsDataURL(file)
          })
          return true
        }

        const text = event.clipboardData?.getData('text/plain')
        if (!text || !looksLikeCode(text)) return false
        const { schema, tr } = view.state
        const codeBlock = schema.nodes.codeBlock
        if (!codeBlock) return false
        const node = codeBlock.create({}, schema.text(text))
        view.dispatch(tr.replaceSelectionWith(node).scrollIntoView())
        return true
      },
    },
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  })

  // Loads this note's content/title into the editor once it's available —
  // the floating window starts with an empty store until init() resolves.
  useEffect(() => {
    if (!note || !editor || hydrated) return
    setTitle(note.title || '')
    setContent(note.content || '')
    editor.commands.setContent(note.content || '', false)
    setHydrated(true)
  }, [note, editor, hydrated])

  // Debounced autosave — skipped until hydrated so loading the note doesn't
  // immediately "save" it back and bump its updatedAt timestamp.
  useEffect(() => {
    if (!hydrated) return
    if (content === note?.content && title === note?.title) return
    const timer = setTimeout(() => {
      updateNote(noteId, { content, title })
    }, 600)
    return () => clearTimeout(timer)
  }, [hydrated, content, title])

  useEffect(() => {
    editor?.setEditable(!note?.trashed, false)
  }, [editor, note?.trashed])

  if (!note) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-muted">
        <div className="animate-spin w-5 h-5 border-2 border-brown-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const colorInfo = NOTE_COLORS[note.color] || NOTE_COLORS.default
  const bgClass = colorInfo.card
    ? `${colorInfo.card} ${colorInfo.cardDark}`
    : 'bg-white dark:bg-gray-900'

  const handleCollapse = () => {
    if (isCollapsed) {
      window.electronAPI?.floating?.setHeight(noteId, expandedHeight, 160)
      setIsCollapsed(false)
    } else {
      setExpandedHeight(window.innerHeight)
      window.electronAPI?.floating?.setHeight(noteId, HEADER_HEIGHT, HEADER_HEIGHT)
      setColorPickerOpen(false)
      setIsCollapsed(true)
    }
  }

  const handleClose = () => {
    if (window.electronAPI?.floating) {
      window.electronAPI.floating.close(noteId)
    } else {
      window.close()
    }
  }

  const handleEdit = () => {
    if (window.electronAPI?.floating) {
      window.electronAPI.floating.editInMain(noteId)
    }
  }

  const handleColorChange = (colorKey) => {
    updateNote(noteId, { color: colorKey })
    setColorPickerOpen(false)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      editor?.commands.focus('start')
    }
  }

  return (
    <div className={`h-screen flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 ${bgClass}`}>
      {/* Header — drag region */}
      <div
        className="flex items-start gap-2 px-4 pt-3.5 pb-2 cursor-grab active:cursor-grabbing select-none"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {colorInfo.swatch && (
          <span
            className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: colorInfo.swatch }}
          />
        )}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled"
            style={{ WebkitAppRegion: 'no-drag' }}
            className="w-full text-sm font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none placeholder:text-muted dark:placeholder:text-gray-700 truncate"
          />
          <p className="text-xs text-muted mt-0.5">
            Last update: {formatDate(note.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
          <button onClick={handleCollapse} className="btn-icon" title={isCollapsed ? 'Expand' : 'Collapse'} aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
            {isCollapsed ? <CaretDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          <button onClick={handleClose} className="btn-icon" title="Close" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content — directly editable */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 text-xs">
          <div className="tiptap-editor">
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      {/* Color picker panel — shown inline above toolbar */}
      {!isCollapsed && colorPickerOpen && (
        <div
          className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(NOTE_COLORS).map(([key, color]) => (
              <button
                key={key}
                onClick={() => handleColorChange(key)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  (note.color || 'default') === key
                    ? 'border-gray-500 dark:border-gray-300 scale-110'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
                style={{ background: color.swatch || '#f9fafb' }}
                title={color.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!isCollapsed && <div
        className="flex items-center px-4 py-2.5 border-t border-gray-100 dark:border-gray-800"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button onClick={handleEdit} className="btn-icon" title="Edit in main editor" aria-label="Edit note">
          <PencilSimple className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setColorPickerOpen(o => !o)}
          className={`btn-icon ${colorPickerOpen ? 'text-brown-500 dark:text-brown-400' : ''}`}
          title="Note color"
          aria-label="Note color"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>}
    </div>
  )
}
