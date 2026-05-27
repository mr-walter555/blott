import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  TextHOne, TextHTwo, TextHThree, List, ListNumbers,
  CheckSquare, Quotes, Code, CodeBlock, Link, Highlighter,
  ArrowCounterClockwise, ArrowClockwise, Minus, Image
} from '@phosphor-icons/react'

export default function EditorToolbar({ editor }) {
  if (!editor) return null

  const insertImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      editor.chain().focus().setImage({ src: ev.target.result, alt: file.name }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const ToolBtn = ({ onClick, active, disabled, title, children }) => (
    <button
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-md text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-brown-100 dark:bg-brown-950/60 text-brown-600 dark:text-brown-400'
          : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )

  const Divider = () => (
    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
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
    <div className="flex items-center gap-0.5 px-6 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-wrap flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
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

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List className="w-5 h-5 text-black dark:text-white" />
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

      <label
        title="Insert Image"
        className="p-2 rounded-md text-sm transition-colors cursor-pointer text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Image className="w-5 h-5 text-black dark:text-white" />
        <input type="file" accept="image/*" className="hidden" onChange={insertImage} />
      </label>

    </div>
  )
}
