import { useState, useRef, useEffect } from 'react'
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  TextHOne, TextHTwo, TextHThree, ListBullets, ListNumbers,
  CheckSquare, Quotes, Code, CodeBlock, Link, Highlighter,
  ArrowCounterClockwise, ArrowClockwise, Minus, Image, Table,
  TextAlignLeft, TextAlignCenter, TextAlignRight, TextAlignJustify
} from '@phosphor-icons/react'

export default function EditorToolbar({ editor }) {
  if (!editor) return null

  const [tableMenuOpen, setTableMenuOpen] = useState(false)
  const tableMenuRef = useRef(null)

  useEffect(() => {
    if (!tableMenuOpen) return
    const close = (e) => { if (!tableMenuRef.current?.contains(e.target)) setTableMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [tableMenuOpen])

  const readAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const insertImages = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    e.target.value = ''
    if (!files.length || !editor) return
    for (const file of files) {
      try {
        const src = await readAsDataURL(file)
        editor.chain().focus().insertContent([
          { type: 'image', attrs: { src, alt: file.name } },
          { type: 'paragraph' },
        ]).run()
      } catch (err) {
        console.error('Failed to read image file:', file.name, err)
      }
    }
  }

  const ToolBtn = ({ onClick, active, disabled, title, children }) => (
    <button
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`p-2 rounded-md text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-brown-100 dark:bg-brown-950/60 text-brown-600 dark:text-brown-400'
          : 'text-muted hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-muted'
      }`}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

  const MenuItem = ({ label, onClick, danger }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`w-full flex items-center px-3 py-1.5 text-sm transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-gray-700 dark:text-muted hover:bg-gray-50 dark:hover:bg-white/[0.06]'
      }`}
    >
      {label}
    </button>
  )

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-6 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 overflow-x-auto bg-gray-50/50 dark:bg-gray-900/50" style={{ scrollbarWidth: 'none' }}>
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <ArrowCounterClockwise className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)">
        <ArrowClockwise className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <TextHOne className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <TextHTwo className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <TextHThree className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <TextB className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <TextItalic className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <TextUnderline className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <TextStrikethrough className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <TextAlignLeft className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <TextAlignCenter className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <TextAlignRight className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <TextAlignJustify className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <ListBullets className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <ListNumbers className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task List">
        <CheckSquare className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quotes className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
        <Code className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <CodeBlock className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Add Link">
        <Link className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider">
        <Minus className="w-5 h-5 text-black dark:text-white" />
      </ToolBtn>
      <Divider />
      <label title="Insert Image(s)" aria-label="Insert Image(s)" className="p-2 rounded-md text-sm transition-colors cursor-pointer text-muted hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-muted">
        <Image className="w-5 h-5 text-black dark:text-white" />
        <input type="file" accept="image/*" multiple className="hidden" onChange={insertImages} />
      </label>
      <Divider />

      {/* Table button + context menu */}
      <div className="relative" ref={tableMenuRef}>
        <ToolBtn
          onClick={() => setTableMenuOpen(o => !o)}
          active={editor.isActive('table') || tableMenuOpen}
          title="Table"
        >
          <Table className="w-5 h-5 text-black dark:text-white" />
        </ToolBtn>

        {tableMenuOpen && (
          <div className="absolute left-0 top-10 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden w-52 py-1">
            {editor.isActive('table') ? (
              <>
                <p className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">Rows</p>
                <MenuItem label="Add row above" onClick={() => { editor.chain().focus().addRowBefore().run(); setTableMenuOpen(false) }} />
                <MenuItem label="Add row below"  onClick={() => { editor.chain().focus().addRowAfter().run();  setTableMenuOpen(false) }} />
                <MenuItem label="Delete row"     onClick={() => { editor.chain().focus().deleteRow().run();    setTableMenuOpen(false) }} danger />
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <p className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">Columns</p>
                <MenuItem label="Add column left"  onClick={() => { editor.chain().focus().addColumnBefore().run(); setTableMenuOpen(false) }} />
                <MenuItem label="Add column right" onClick={() => { editor.chain().focus().addColumnAfter().run();  setTableMenuOpen(false) }} />
                <MenuItem label="Delete column"    onClick={() => { editor.chain().focus().deleteColumn().run();    setTableMenuOpen(false) }} danger />
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <MenuItem label="Toggle header row" onClick={() => { editor.chain().focus().toggleHeaderRow().run(); setTableMenuOpen(false) }} />
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <MenuItem label="Delete table" onClick={() => { editor.chain().focus().deleteTable().run(); setTableMenuOpen(false) }} danger />
              </>
            ) : (
              <>
                <p className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">Insert table</p>
                <MenuItem label="2 × 2" onClick={() => { editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(); setTableMenuOpen(false) }} />
                <MenuItem label="3 × 3" onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setTableMenuOpen(false) }} />
                <MenuItem label="4 × 4" onClick={() => { editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run(); setTableMenuOpen(false) }} />
                <MenuItem label="3 × 5" onClick={() => { editor.chain().focus().insertTable({ rows: 5, cols: 3, withHeaderRow: true }).run(); setTableMenuOpen(false) }} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
