import { motion } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'
import {
  Article, PencilSimple, TextT, ListBullets,
  ListChecks, ArrowsOutSimple, ArrowsInSimple
} from '@phosphor-icons/react'

export const AI_ACTIONS = [
  // showReplace: result transforms selected text — replaces it in place
  // showInsert:  result is supplementary content — inserts below
  { id: 'summarize', label: 'Summarize',    icon: Article,         desc: 'Condense key points',    showReplace: false, showInsert: true  },
  { id: 'rewrite',   label: 'Rewrite',      icon: PencilSimple,    desc: 'Professional tone',      showReplace: true,  showInsert: true  },
  { id: 'grammar',   label: 'Fix Grammar',  icon: TextT,           desc: 'Spelling & punctuation', showReplace: true,  showInsert: false },
  { id: 'bullets',   label: 'To Bullets',   icon: ListBullets,     desc: 'Convert to list',        showReplace: true,  showInsert: false },
  { id: 'actions',   label: 'Action Items', icon: ListChecks,      desc: 'Extract tasks',          showReplace: false, showInsert: true  },
  { id: 'expand',    label: 'Expand',       icon: ArrowsOutSimple, desc: 'Add more detail',        showReplace: true,  showInsert: false },
  { id: 'simplify',  label: 'Simplify',     icon: ArrowsInSimple,  desc: 'Make it clearer',        showReplace: true,  showInsert: false },
]

// Pure action picker — no async logic, just emits the chosen action
export default function AIActionMenu({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden w-56"
      style={{ fontFamily: 'Sora Variable, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-5 h-5 rounded-md bg-brown-100 dark:bg-brown-950/40 flex items-center justify-center flex-shrink-0">
          <Sparkle className="w-3 h-3 text-brown-600 dark:text-brown-400" weight="fill" />
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide">AI Actions</span>
      </div>

      {/* Actions */}
      <div className="py-1">
        {AI_ACTIONS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onMouseDown={e => { e.preventDefault(); onSelect(id) }}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-tight">{label}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-tight mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
