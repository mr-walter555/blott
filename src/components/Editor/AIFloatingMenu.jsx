import { useState } from 'react'
import { Sparkle, CircleNotch, Check, X } from '@phosphor-icons/react'
import { processText } from '../../services/aiService'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIONS = [
  { id: 'summarize', label: 'Summarize' },
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'grammar', label: 'Fix Grammar' },
  { id: 'bullets', label: 'To Bullets' },
  { id: 'actions', label: 'Action Items' },
  { id: 'expand', label: 'Expand' },
  { id: 'simplify', label: 'Simplify' },
]

export default function AIFloatingMenu({ editor, onClose }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeAction, setActiveAction] = useState(null)

  const getSelectedText = () => {
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, ' ')
  }

  const handleAction = async (actionId) => {
    const text = getSelectedText()
    if (!text?.trim()) return

    setLoading(true)
    setActiveAction(actionId)
    setResult(null)

    try {
      const res = await processText(actionId, text)
      setResult(res)
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'AI not available'
      setResult(`⚠️ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const applyResult = () => {
    if (!result) return
    editor.chain().focus().insertContentAt(editor.state.selection, result).run()
    setResult(null)
    setActiveAction(null)
    onClose?.()
  }

  const dismiss = () => {
    setResult(null)
    setActiveAction(null)
    onClose?.()
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Action list */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 w-44 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1 mb-0.5">
          <Sparkle className="w-3.5 h-3.5 text-brown-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">AI Actions</span>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 mb-1" />
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onMouseDown={e => { e.preventDefault(); handleAction(action.id) }}
            disabled={loading}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left ${
              activeAction === action.id
                ? 'bg-brown-50 dark:bg-brown-900/40 text-brown-600 dark:text-brown-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            } disabled:opacity-50`}
          >
            {loading && activeAction === action.id
              ? <CircleNotch className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              : <span className="w-3.5" />}
            {action.label}
          </button>
        ))}
      </div>

      {/* Result preview */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 max-w-sm"
          >
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-2 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {result}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onMouseDown={e => { e.preventDefault(); applyResult() }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-brown-600 hover:bg-brown-700 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="w-3 h-3" /> Apply
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); dismiss() }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg font-medium transition-colors"
              >
                <X className="w-3 h-3" /> Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}