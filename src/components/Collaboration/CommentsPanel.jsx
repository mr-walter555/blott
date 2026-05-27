import { useState, useEffect, useRef } from 'react'
import { X, ChatCircle, PaperPlaneRight, Trash } from '@phosphor-icons/react'

const BASE = 'http://localhost:3001/api/comments'

export default function CommentsPanel({ shareToken, userId, displayName, onNewComment, onClose }) {
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!shareToken) return
    fetch(`${BASE}/${shareToken}`)
      .then(r => r.ok ? r.json() : [])
      .then(setComments)
      .catch(() => {})
  }, [shareToken])

  // Scroll to bottom when new comment arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const submit = async () => {
    if (!body.trim() || !shareToken) return
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE}/${shareToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName, body: body.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, comment])
        setBody('')
        onNewComment?.(comment)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (id) => {
    await fetch(`${BASE}/${shareToken}/${id}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => (c._id || c.id) !== id))
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ChatCircle className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Comments</span>
          {comments.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{comments.length}</span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-8 italic">No comments yet</p>
        ) : (
          comments.map(c => {
            const id = c._id || c.id
            const isOwn = c.userId === userId
            return (
              <div key={id} className="group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-brown-100 flex items-center justify-center text-[10px] font-bold text-brown-600 flex-shrink-0">
                      {(c.displayName || 'A')[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{c.displayName || 'Anonymous'}</span>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => deleteComment(id)}
                      className="opacity-0 group-hover:opacity-100 btn-icon p-0.5"
                    >
                      <Trash className="w-3 h-3 text-red-400" />
                    </button>
                  )}
                </div>
                {c.selectedText && (
                  <blockquote className="mt-1 ml-6 text-xs text-gray-400 border-l-2 border-gray-200 pl-2 italic truncate">
                    {c.selectedText}
                  </blockquote>
                )}
                <p className="mt-1 ml-6 text-sm text-gray-700 leading-relaxed">{c.body}</p>
                <p className="mt-0.5 ml-6 text-[10px] text-gray-400">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Add a comment…"
            rows={2}
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-500/20 resize-none placeholder:text-gray-400"
          />
          <button
            onClick={submit}
            disabled={!body.trim() || submitting}
            className="self-end p-2 rounded-lg bg-brown-600 hover:bg-brown-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <PaperPlaneRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
