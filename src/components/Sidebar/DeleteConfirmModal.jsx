import { Trash } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useFocusTrap } from '../../hooks/useFocusTrap'

export default function DeleteConfirmModal({ note, onConfirm, onCancel }) {
  const dialogRef = useFocusTrap()

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Icon + Copy */}
          <div className="flex flex-col items-center px-7 pt-8 pb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <Trash className="w-7 h-7 text-red-500" weight="fill" />
            </div>
            <h3 id="delete-confirm-title" className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete permanently?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-200">"{note.title || 'Untitled'}"</span> will be gone forever and cannot be recovered.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 px-5 pb-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium transition-colors"
            >
              Delete forever
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
