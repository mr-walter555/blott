import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import {
  Sparkle, X, ArrowUp, FileText, CaretDown, CaretLeft, PlusCircle,
  Copy, Plus, ThumbsUp, ThumbsDown, Microphone, SlidersHorizontal,
  ClockCounterClockwise, Trash, ChatCircleText, PencilSimple,
  Rectangle, SidebarSimple, PictureInPicture, Check,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import { askNotes } from '../../services/aiService'
import { rankNotesByRelevance } from '../../utils/noteSearch'
import { loadConversations, saveConversation, deleteConversation } from '../../utils/askAIHistory'
import { formatDate, truncate } from '../../utils/helpers'

const SUGGESTIONS = [
  'What have I written about lately?',
  'Summarize my notes from this week',
  'Do I have any unfinished tasks?',
]

const LAYOUTS = [
  { id: 'sidebar',  label: 'Sidebar',  icon: SidebarSimple },
  { id: 'floating', label: 'Floating', icon: PictureInPicture },
]

function InlineText({ text, sources, onOpenNote }) {
  const parts = text.split(/(\[\d+\]|`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const citation = part.match(/^\[(\d+)\]$/)
    if (citation) {
      const source = sources[Number(citation[1]) - 1]
      if (!source) return <span key={i}>{part}</span>
      return (
        <button
          key={i}
          onClick={() => onOpenNote(source.id)}
          className="inline-flex items-center justify-center mx-0.5 px-1.5 h-5 rounded-md text-[11px] font-medium bg-brown-100 dark:bg-brown-950/50 text-brown-700 dark:text-brown-400 hover:bg-brown-200 dark:hover:bg-brown-900/60 transition-colors align-middle"
          title={source.title}
        >
          {citation[1]}
        </button>
      )
    }
    const code = part.match(/^`([^`]+)`$/)
    if (code) return (
      <code key={i} className="mx-0.5 px-1.5 py-0.5 rounded-md text-[12px] font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
        {code[1]}
      </code>
    )
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={i} className="font-semibold">{bold[1]}</strong>
    return <span key={i}>{part}</span>
  })
}

function AnswerText({ text, sources, onOpenNote }) {
  // Split into blocks separated by blank lines
  const blocks = text.split(/\n{2,}/)
  const baseText = 'text-sm text-gray-700 dark:text-gray-300 leading-relaxed'

  return (
    <div className={`${baseText} space-y-2`}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim())
        const isBullet = lines.every(l => /^[\*\-]\s/.test(l.trim()))
        const isNumbered = lines.every(l => /^\d+\.\s/.test(l.trim()))

        if ((isBullet || isNumbered) && lines.length > 0) {
          const Tag = isNumbered ? 'ol' : 'ul'
          return (
            <Tag key={bi} className={isNumbered ? 'list-decimal pl-5 space-y-0.5' : 'list-disc pl-5 space-y-0.5'}>
              {lines.map((line, li) => {
                const content = line.trim().replace(/^[\*\-]\s+/, '').replace(/^\d+\.\s+/, '')
                return (
                  <li key={li}>
                    <InlineText text={content} sources={sources} onOpenNote={onOpenNote} />
                  </li>
                )
              })}
            </Tag>
          )
        }

        // Mixed block — render line by line, wrapping bullet lines in <li> if needed
        return (
          <p key={bi} className="whitespace-pre-wrap">
            <InlineText text={block} sources={sources} onOpenNote={onOpenNote} />
          </p>
        )
      })}
    </div>
  )
}

export default function AskAIModal() {
  const closeAskAI     = useUIStore(s => s.closeAskAI)
  const askAIOpen      = useUIStore(s => s.askAIOpen)
  const layoutId       = useUIStore(s => s.askAILayout)
  const setAskAILayout = useUIStore(s => s.setAskAILayout)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const notes          = useNotesStore(s => s.notes)

  const [conversationId, setConversationId] = useState(() => uuidv4())
  const [question, setQuestion]   = useState('')
  const [thread, setThread]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const [history, setHistory]     = useState(() => loadConversations())
  const [historyOpen, setHistoryOpen]       = useState(false)
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false)
  const [editingIndex, setEditingIndex]     = useState(null)
  const [editingText, setEditingText]       = useState('')
  const inputRef     = useRef(null)
  const scrollRef    = useRef(null)
  const layoutMenuRef = useRef(null)

  useEffect(() => { if (askAIOpen) inputRef.current?.focus() }, [askAIOpen])

  useEffect(() => {
    if (!layoutMenuOpen) return
    const handler = (e) => {
      if (!layoutMenuRef.current?.contains(e.target)) setLayoutMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [layoutMenuOpen])

  const chooseLayout = (id) => {
    setAskAILayout(id)
    setLayoutMenuOpen(false)
  }

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  useEffect(() => { scrollToBottom() }, [thread, loading, scrollToBottom])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowJumpToBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 80)
  }

  const openNote = (id) => {
    setSelectedNote(id)
    closeAskAI()
  }

  const ask = async (q, baseThread = thread) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setQuestion('')
    setLoading(true)
    const candidates = rankNotesByRelevance(trimmed, Object.values(notes).filter(n => !n.trashed))
    let nextThread
    try {
      const { answer, citedIds } = await askNotes(trimmed, candidates)
      const cited = candidates.filter(s => citedIds?.includes(s.id))
      nextThread = [...baseThread, { question: trimmed, answer, sources: candidates, cited }]
    } catch (err) {
      nextThread = [...baseThread, { question: trimmed, error: err?.response?.data?.error || err.message || 'Something went wrong.' }]
    } finally {
      setLoading(false)
    }
    setThread(nextThread)
    setHistory(saveConversation({ id: conversationId, thread: nextThread }))
  }

  const submitEdit = (index, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const truncated = thread.slice(0, index)
    setThread(truncated)
    setEditingIndex(null)
    setEditingText('')
    ask(trimmed, truncated)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(question) }
    else if (e.key === 'Escape') closeAskAI()
  }

  const copyTranscript = () => {
    if (!thread.length) return
    navigator.clipboard?.writeText(
      thread.map(t => `Q: ${t.question}\n${t.error ? `(error) ${t.error}` : `A: ${t.answer}`}`).join('\n\n')
    ).then(() => toast.success('Conversation copied'))
  }

  const newConversation = () => {
    setConversationId(uuidv4())
    setThread([])
    setQuestion('')
    setHistoryOpen(false)
    inputRef.current?.focus()
  }

  const openConversation = (conv) => {
    setConversationId(conv.id)
    setThread(conv.thread)
    setQuestion('')
    setHistoryOpen(false)
  }

  const removeConversation = (e, id) => {
    e.stopPropagation()
    setHistory(deleteConversation(id))
    if (id === conversationId) newConversation()
  }

  // ── Shared panel UI ────────────────────────────────────────────────────────
  const panel = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pl-2 pr-2 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={() => setHistoryOpen(o => !o)}
          className="flex items-center gap-1.5 min-w-0 pl-2 pr-2.5 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
        >
          {historyOpen
            ? <CaretLeft className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <Sparkle className="w-4 h-4 text-brown-500 flex-shrink-0" weight="fill" />}
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {historyOpen ? 'History' : 'Ask your notes'}
          </h2>
          {!historyOpen && <CaretDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        </button>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setHistoryOpen(o => !o)}
            className={`btn-icon ${historyOpen ? 'bg-gray-100 dark:bg-white/[0.08]' : ''}`}
            title="Conversation history"
          >
            <ClockCounterClockwise className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button onClick={copyTranscript} disabled={!thread.length} className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed" title="Copy conversation">
            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button onClick={newConversation} disabled={!thread.length} className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed" title="New conversation">
            <PlusCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Layout switcher */}
          <div className="relative" ref={layoutMenuRef}>
            <button
              onClick={() => setLayoutMenuOpen(o => !o)}
              className={`btn-icon ${layoutMenuOpen ? 'bg-gray-100 dark:bg-white/[0.08]' : ''}`}
              title="Chat layout"
            >
              <Rectangle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <AnimatePresence>
              {layoutMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl py-1.5 z-10"
                >
                  {LAYOUTS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => chooseLayout(id)}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      {id === layoutId && <Check className="w-4 h-4 text-brown-500 flex-shrink-0" weight="bold" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
          <button onClick={closeAskAI} className="btn-icon" title="Close">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence initial={false}>
          {historyOpen ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 overflow-y-auto px-2.5 py-2.5"
            >
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
                  <ChatCircleText className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">No past conversations yet</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {history.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        conv.id === conversationId
                          ? 'bg-gray-100 dark:bg-white/[0.08]'
                          : 'hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-brown-50 dark:bg-brown-950/40 flex items-center justify-center flex-shrink-0">
                        <ChatCircleText className="w-4 h-4 text-brown-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{truncate(conv.title, 56)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                          {formatDate(conv.updatedAt)} · {conv.thread.length} {conv.thread.length === 1 ? 'message' : 'messages'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => removeConversation(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex-shrink-0"
                        title="Delete conversation"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0"
            >
              <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 py-4 space-y-5">
                {thread.length === 0 && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-2">
                    <div className="w-11 h-11 rounded-full bg-brown-50 dark:bg-brown-950/40 flex items-center justify-center">
                      <Sparkle className="w-5 h-5 text-brown-500" weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask anything about your notes</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">I'll search what you've written and answer with sources, cited like [1]</p>
                    </div>
                  </div>
                )}

                {thread.map((turn, i) => (
                  <div key={i} className="space-y-2.5">
                    {editingIndex === i ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="ml-auto w-full max-w-[92%]"
                      >
                        <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-brown-200 dark:border-brown-800/70 shadow-sm">
                          {/* Edit-mode label */}
                          <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                            <PencilSimple className="w-3 h-3 text-brown-400 dark:text-brown-500 flex-shrink-0" weight="bold" />
                            <span className="text-[10px] font-semibold tracking-widest uppercase text-brown-400 dark:text-brown-500 select-none">
                              Editing
                            </span>
                          </div>

                          {/* Textarea */}
                          <textarea
                            autoFocus
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(i, editingText) }
                              if (e.key === 'Escape') { setEditingIndex(null); setEditingText('') }
                            }}
                            className="w-full bg-transparent px-4 pb-3 pt-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none resize-none leading-relaxed"
                            rows={Math.max(2, Math.min(6, (editingText.match(/\n/g) || []).length + 2))}
                          />

                          {/* Action bar */}
                          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                            <button
                              onClick={() => { setEditingIndex(null); setEditingText('') }}
                              className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                              Cancel
                            </button>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] text-gray-300 dark:text-gray-700 select-none">⏎ to send</span>
                              <button
                                onClick={() => submitEdit(i, editingText)}
                                disabled={!editingText.trim()}
                                className="flex items-center justify-center w-7 h-7 rounded-lg bg-brown-600 hover:bg-brown-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                                title="Send edit"
                              >
                                <ArrowUp className="w-3.5 h-3.5" weight="bold" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 group">
                        <button
                          onClick={() => { setEditingIndex(i); setEditingText(turn.question) }}
                          className="opacity-0 group-hover:opacity-100 btn-icon !w-6 !h-6 transition-opacity flex-shrink-0"
                          title="Edit message"
                        >
                          <PencilSimple className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </button>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5 w-fit max-w-[85%] truncate">
                          {turn.question}
                        </p>
                      </div>
                    )}
                    {turn.error ? (
                      <p className="text-sm text-red-500">⚠️ {turn.error}</p>
                    ) : (
                      <div className="space-y-2">
                        <AnswerText text={turn.answer} sources={turn.sources} onOpenNote={openNote} />
                        <div className="flex items-center gap-1 pt-0.5">
                          <button onClick={() => navigator.clipboard?.writeText(turn.answer).then(() => toast.success('Copied'))} className="btn-icon !w-7 !h-7" title="Copy answer">
                            <Copy className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          </button>
                          <button className="btn-icon !w-7 !h-7" title="Add to note">
                            <Plus className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          </button>
                          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                          <button className="btn-icon !w-7 !h-7" title="Good response">
                            <ThumbsUp className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          </button>
                          <button className="btn-icon !w-7 !h-7" title="Bad response">
                            <ThumbsDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          </button>
                        </div>
                        {turn.cited?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {turn.cited.map(s => (
                              <button
                                key={s.id}
                                onClick={() => openNote(s.id)}
                                className="flex items-center gap-1.5 text-xs pl-2 pr-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate max-w-[9rem]">{s.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 2a10 10 0 0 0-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
                    </svg>
                    Searching your notes…
                  </div>
                )}
              </div>

              {showJumpToBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-900/90 dark:bg-gray-100/90 text-white dark:text-gray-900 flex items-center justify-center shadow-lg hover:bg-gray-900 dark:hover:bg-white transition-colors"
                  title="Jump to latest"
                >
                  <CaretDown className="w-4 h-4" weight="bold" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion chips */}
      {!historyOpen && thread.length === 0 && (
        <div className="px-4 pb-2.5 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="flex-shrink-0 text-left text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {!historyOpen && (
        <div className="px-3 pb-3 pt-1 flex-shrink-0">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3 pt-2.5 pb-2 focus-within:border-brown-300 dark:focus-within:border-brown-700 transition-colors">
            <textarea
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Do anything with AI…"
              rows={1}
              className="w-full bg-transparent outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 max-h-24"
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1">
                <button className="btn-icon !w-7 !h-7" title="Add context">
                  <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
                <button className="flex items-center gap-1 px-2 h-7 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Auto
                </button>
              </div>
              <div className="flex items-center gap-0.5">
                <button className="btn-icon !w-7 !h-7" title="Voice input">
                  <Microphone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
                <button
                  onClick={() => ask(question)}
                  disabled={!question.trim() || loading}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-brown-600 hover:bg-brown-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
                >
                  <ArrowUp className="w-4 h-4" weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Rendering ──────────────────────────────────────────────────────────────

  // Sidebar mode: portal panel into the GSAP-animated slot inside MainLayout
  // The slot's width animation (0 ↔ 384px) creates the "push content" effect
  if (layoutId === 'sidebar') {
    const slot = document.getElementById('ai-sidebar-slot')
    if (!askAIOpen || !slot) return null
    return createPortal(
      <div className="bg-white dark:bg-gray-900 h-full flex flex-col overflow-hidden">
        {panel}
      </div>,
      slot
    )
  }

  // Floating mode: animated overlay that expands from the FAB (bottom-right origin)
  return (
    <AnimatePresence>
      {askAIOpen && (
        <div key="floating-overlay" className="fixed inset-0 z-50 pointer-events-none">
          <motion.div
            initial={{ scale: 0.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.05, opacity: 0 }}
            style={{ transformOrigin: 'bottom right' }}
            transition={{
              scale: { type: 'spring', stiffness: 380, damping: 26, mass: 0.8 },
              opacity: { duration: 0.12 },
            }}
            className="pointer-events-auto absolute right-3 bottom-3 w-[30rem] h-[34rem] max-h-[calc(100%-1.5rem)] flex flex-col"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
              {panel}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
