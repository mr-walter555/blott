import { useState, useEffect, useRef, useCallback } from 'react'
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
import ResizableImage from './extensions/ResizableImage'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)
import { useNotesStore } from '../../store/notesStore'
import { useUIStore, FONT_FAMILIES } from '../../store/uiStore'
import { useAutoSave } from '../../hooks/useAutoSave'
import EditorToolbar from './EditorToolbar'
import AIActionMenu, { AI_ACTIONS } from './AIActionMenu'
import AIResultPanel from './AIResultPanel'
import { processText } from '../../services/aiService'
import { AnimatePresence, motion } from 'framer-motion'
import NoteHeader from './NoteHeader'
import { getWordCount } from '../../utils/helpers'
import { markdownToHtml } from '../../utils/markdownToHtml'
import { handleLinkClick } from '../../utils/handleLinkClick'

const CODE_KEYWORDS = /\b(function|const|let|var|import|export|def|async|await|=>|interface|typeof|instanceof)\b/
const CODE_SYMBOLS = /[{};]|=>|::|->|&&|\|\||\/\//

function looksLikeCode(text) {
  const lines = text.split('\n')
  if (lines.length < 3) return false
  const hasIndent = lines.some(l => /^(\t| {2,})/.test(l))
  const hasCodeMarkers = CODE_KEYWORDS.test(text) || CODE_SYMBOLS.test(text)
  return hasIndent && hasCodeMarkers
}

function AILoadingBar({ label, top, scrollRef, onStop }) {
  const rect        = scrollRef.current?.getBoundingClientRect()
  const editorW     = rect?.width  || window.innerWidth
  const editorLeft  = rect?.left   || 0
  const contentW    = Math.min(768, editorW)
  const paddedLeft  = editorLeft + (editorW - contentW) / 2 + 32
  const paddedWidth = contentW - 64
  return (
    <motion.div
      key="ai-loading"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-50"
      style={{ top, left: paddedLeft, width: paddedWidth }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm w-full">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M12 2a10 10 0 0 0-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
        </svg>
        <span className="text-sm text-gray-400 dark:text-gray-500 flex-1">{label}…</span>
        <button onMouseDown={e => { e.preventDefault(); onStop() }}
          className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center flex-shrink-0 transition-colors" title="Stop" aria-label="Stop">
          <div className="w-2.5 h-2.5 rounded-sm bg-gray-500 dark:bg-gray-300" />
        </button>
      </div>
    </motion.div>
  )
}

export default function NoteEditor({ noteId }) {
  const note            = useNotesStore(s => s.notes[noteId])
  const pendingNoteAppend = useNotesStore(s => s.pendingNoteAppend)
  const clearPendingNoteAppend = useNotesStore(s => s.clearPendingNoteAppend)
  const fontSize        = useUIStore(s => s.fontSize)
  const fontFamily      = useUIStore(s => s.fontFamily)
  const focusMode       = useUIStore(s => s.focusMode)
  const toggleFocusMode = useUIStore(s => s.toggleFocusMode)

  const [title, setTitle]     = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'unsaved' | 'saving' | 'error'
  const [menuPos,   setMenuPos]   = useState(null)
  const [aiResult,  setAiResult]  = useState(null)
  const [aiLoadingVer, setAiLoadingVer] = useState(0)
  const aiLoadingRef = useRef(null)
  const aiAbortRef = useRef(null)
  const menuRef = useRef(null)

  const aiLoading = aiLoadingRef.current

  function showLoading(data) {
    aiLoadingRef.current = data
    setAiLoadingVer(v => v + 1)
  }
  function hideLoading() {
    aiLoadingRef.current = null
    setAiLoadingVer(v => v + 1)
  }
  const [scrollPct, setScrollPct] = useState(0)
  const scrollRef = useRef(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setScrollPct(max > 0 ? el.scrollTop / max : 0)
  }, [])

  useEffect(() => {
    if (!focusMode) return
    const handler = (e) => { if (e.key === 'Escape') toggleFocusMode() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusMode, toggleFocusMode])

  const saveNow = useAutoSave(noteId, content, title, {
    onSaving: () => setSaveStatus('saving'),
    onSaved:  () => setSaveStatus('saved'),
    onError:  () => setSaveStatus('error'),
  })

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveNow])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, history: { depth: 500, newGroupDelay: 300 }, code: { HTMLAttributes: { spellcheck: 'false' } } }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext', HTMLAttributes: { class: 'code-block' } }),
      ResizableImage.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'editor-image' } }),
      Placeholder.configure({ placeholder: 'Start writing… or right-click selected text for AI tools' }),
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
    content: note?.content || '',
    editable: !note?.trashed,
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
              // Pair each image with a trailing paragraph — TipTap leaves the
              // freshly-inserted image selected, so without it a second pasted
              // image would replace the first instead of adding alongside it.
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
      setSaveStatus('unsaved')
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

  // If this note is edited elsewhere (e.g. a floating sticky note) while open
  // here, refresh title/content from the broadcast — but only when this
  // editor has no unsaved local changes, so we never clobber active edits.
  useEffect(() => {
    if (!window.electronAPI?.onNoteUpdated) return
    return window.electronAPI.onNoteUpdated((updated) => {
      if (updated.id !== noteId || saveStatus !== 'saved') return
      setTitle(updated.title || '')
      if (editor && editor.getHTML() !== updated.content) {
        editor.commands.setContent(updated.content || '', false)
        setContent(updated.content || '')
      }
    })
  }, [noteId, editor, saveStatus])

  // Live-insert content appended from elsewhere (e.g. "Add to note" in Ask AI)
  // when this note's editor happens to be open.
  useEffect(() => {
    if (!editor || !pendingNoteAppend || pendingNoteAppend.noteId !== noteId) return
    editor.chain().focus('end').insertContent(pendingNoteAppend.html).run()
    clearPendingNoteAppend()
  }, [pendingNoteAppend, editor, noteId, clearPendingNoteAppend])

  useEffect(() => {
    if (editor) {
      const size = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px'
      editor.view.dom.style.fontSize = size
      editor.view.dom.style.fontFamily = (FONT_FAMILIES[fontFamily] || FONT_FAMILIES.geist).value
    }
  }, [editor, fontSize, fontFamily])

  // Trashed notes are read-only — restoring flips the editor back to editable.
  useEffect(() => {
    editor?.setEditable(!note?.trashed, false)
  }, [editor, note?.trashed])

  useEffect(() => {
    if (!menuPos) return
    const close = (e) => {
      if (menuRef.current?.contains(e.target)) return
      setMenuPos(null)
      // Never clear aiLoading here — only the stop button or AI completion should do that
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menuPos])

  async function handleAIAction(actionId) {
    if (!editor) return
    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')
    if (!text.trim()) return

    const action = AI_ACTIONS.find(a => a.id === actionId)
    const coords = editor.view.coordsAtPos(to)

    const editorRect = scrollRef.current?.getBoundingClientRect()

    // Close menu, show loading bar
    setMenuPos(null)
    setAiResult(null)
    const barTop = Math.min(Math.max(coords.bottom + 10, 60), window.innerHeight - 64)
    showLoading({ label: action?.label || 'Processing', top: barTop, left: coords.left })

    aiAbortRef.current = new AbortController()

    try {
      const result = await processText(actionId, text, { signal: aiAbortRef.current.signal })
      setAiResult({ text: result, actionId, selFrom: from, selTo: to, x: coords.left, y: coords.bottom, editorRect })
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return
      setAiResult({ error: err?.response?.data?.error || err.message || 'AI not available', actionId, selFrom: from, selTo: to, x: coords.left, y: coords.bottom, editorRect })
    } finally {
      hideLoading()
    }
  }

  function applyAIResult(mode) {
    if (!aiResult || !editor) return
    const { text, selFrom, selTo } = aiResult
    const html = markdownToHtml(text)
    if (mode === 'replace') {
      editor.chain().focus().setTextSelection({ from: selFrom, to: selTo }).insertContent(html).run()
    } else {
      editor.chain().focus().setTextSelection(selTo).insertContent(html).run()
    }
    setAiResult(null)
  }

  const handleTitleChange = (e) => { setTitle(e.target.value); setSaveStatus('unsaved') }

  const handleContextMenu = (e) => {
    if (!editor || note?.trashed) return
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
    <div className="flex h-full bg-white dark:bg-gray-950 flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <NoteHeader note={note} editor={editor} />

        {/* Voice memo player */}

        {!note.trashed && <EditorToolbar editor={editor} />}

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-y-auto tiptap-scroll" ref={scrollRef} onScroll={handleScroll} style={{scrollbarWidth:'none'}}>
          <div className={`mx-auto px-10 pt-10 pb-24 max-w-3xl`}>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              readOnly={note.trashed}
              placeholder="Untitled"
              className={`w-full text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 mb-4 resize-none leading-tight ${note.trashed ? 'cursor-default' : ''}`}
            />
            <div className="tiptap-editor" onContextMenu={handleContextMenu}>
              <EditorContent editor={editor} />
            </div>
          </div>
          </div>

          {/* Scroll indicator — fixed to the right, outside scroll area */}
          <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none py-4 px-2 flex-shrink-0">
            {Array.from({ length: 16 }, (_, i) => {
              const active = Math.round(scrollPct * 15) === i
              return (
                <div key={i} className={`rounded-full transition-all duration-150 ${
                  active ? 'w-4 bg-gray-600 dark:bg-gray-400' : 'w-3 bg-gray-300 dark:bg-gray-700'
                }`} style={{ height: active ? 3 : 2 }} />
              )
            })}
          </div>
        </div>

        {/* AI action menu */}
        <AnimatePresence>
          {menuPos && editor && (
            <div ref={menuRef} className="fixed z-50"
              style={{ top: Math.min(menuPos.y + 8, window.innerHeight - 420), left: Math.min(menuPos.x + 4, window.innerWidth - 240) }}>
              <AIActionMenu onSelect={id => { setMenuPos(null); handleAIAction(id) }} />
            </div>
          )}
        </AnimatePresence>

        {/* Loading bar + result panel — single AnimatePresence for seamless handoff */}
        <AnimatePresence mode="wait">
          {aiLoading ? (
            <AILoadingBar
              key="loading"
              label={aiLoading.label}
              top={aiLoading.top}
              scrollRef={scrollRef}
              onStop={() => { aiAbortRef.current?.abort(); hideLoading() }}
            />
          ) : aiResult ? (
            <AIResultPanel
              key="result"
              result={aiResult}
              actionLabel={AI_ACTIONS.find(a => a.id === aiResult.actionId)?.label || 'Result'}
              showReplace={AI_ACTIONS.find(a => a.id === aiResult.actionId)?.showReplace ?? true}
              showInsert={AI_ACTIONS.find(a => a.id === aiResult.actionId)?.showInsert ?? true}
              x={aiResult.x}
              y={aiResult.y}
              editorRect={aiResult.editorRect}
              onReplace={() => applyAIResult('replace')}
              onInsertBelow={() => applyAIResult('insert')}
              onDiscard={() => setAiResult(null)}
              onRetry={() => { const id = aiResult.actionId; setAiResult(null); handleAIAction(id) }}
            />
          ) : null}
        </AnimatePresence>

        <div className="flex items-center justify-between px-8 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
          <span className={
            saveStatus === 'error'   ? 'text-red-400' :
            saveStatus === 'unsaved' ? 'text-amber-400' :
            saveStatus === 'saving'  ? 'text-gray-400 dark:text-gray-500' :
            'text-gray-400 dark:text-gray-500'
          }>
            {saveStatus === 'error'   ? 'Failed to save' :
             saveStatus === 'unsaved' ? 'Unsaved changes' :
             saveStatus === 'saving'  ? 'Saving…' :
             'Auto-saved'}
          </span>
        </div>
      </div>
    </div>
  )
}
