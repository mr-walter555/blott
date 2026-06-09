import { motion } from 'framer-motion'
import { Check, ArrowBendDownLeft, X, ArrowCounterClockwise, Sparkle, ThumbsUp, ThumbsDown } from '@phosphor-icons/react'

function FormattedText({ text }) {
  const lines = (text || '').split('\n')
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        const isBullet = /^[-*•]\s/.test(line.trim())
        const clean    = line.replace(/^[-*•]\s/, '')
        const parts    = clean.split(/(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j} className="font-semibold text-gray-900">{part.slice(2,-2)}</strong>
          if (part.startsWith('*') && part.endsWith('*'))
            return <em key={j}>{part.slice(1,-1)}</em>
          return part
        })
        return isBullet ? (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">{parts}</p>
          </div>
        ) : (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">{parts}</p>
        )
      })}
    </div>
  )
}

export default function AIResultPanel({
  result, actionLabel, x, y, editorRect,
  showReplace = true, showInsert = true,
  onReplace, onInsertBelow, onDiscard, onRetry
}) {
  const editorW    = editorRect?.width  || window.innerWidth
  const editorLeft = editorRect?.left   || 0
  const contentW   = Math.min(768, editorW)
  const paddedLeft = editorLeft + (editorW - contentW) / 2 + 32
  const paddedW    = contentW - 64
  const top        = Math.min(y + 8, window.innerHeight - 380)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-50"
      style={{ top, left: paddedLeft, width: paddedW, fontFamily: 'Geist Variable, sans-serif' }}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">

        {/* Header row */}
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
          <Sparkle className="w-3.5 h-3.5 text-brown-500 flex-shrink-0" weight="fill" />
          <span className="text-xs font-medium text-gray-400">{actionLabel}</span>
        </div>

        {/* Result body */}
        <div className="px-4 py-3 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <FormattedText text={result} />
        </div>

        {/* Footer — icon-first, minimal */}
        <div className="flex items-center gap-1 px-3 py-2.5 border-t border-gray-100">
          {showReplace && (
            <button
              onMouseDown={e => { e.preventDefault(); onReplace() }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-3 h-3" weight="bold" />
              Replace
            </button>
          )}
          {showInsert && (
            <button
              onMouseDown={e => { e.preventDefault(); onInsertBelow() }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                showReplace
                  ? 'text-gray-500 border border-gray-200 hover:bg-gray-50'
                  : 'font-semibold bg-gray-900 hover:bg-gray-700 text-white'
              }`}
            >
              <ArrowBendDownLeft className="w-3 h-3" />
              Insert below
            </button>
          )}

          {/* Right side icon buttons */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button onMouseDown={e => { e.preventDefault(); onRetry() }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Retry">
              <ArrowCounterClockwise className="w-3.5 h-3.5" />
            </button>
            <button onMouseDown={e => { e.preventDefault(); onDiscard() }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
