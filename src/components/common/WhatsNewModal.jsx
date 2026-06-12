import { motion } from 'framer-motion'
import { X, Sparkle } from '@phosphor-icons/react'
import { MODAL_BACKDROP, MODAL_CONTENT } from '../../utils/motionPresets'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { sanitizeNoteHtml } from '../../utils/sanitizeHtml'

export default function WhatsNewModal({ version, notes, onClose }) {
  const dialogRef = useFocusTrap()

  return (
    <>
      <motion.div
        {...MODAL_BACKDROP}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div
          {...MODAL_CONTENT}
          className="pointer-events-auto w-full max-w-2xl h-[min(75vh,600px)] flex flex-col"
        >
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="whats-new-title" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h2 id="whats-new-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">What's new in v{version}</h2>
              <button onClick={onClose} className="btn-icon">
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-brown-50 dark:bg-brown-950/40 flex items-center justify-center mb-6 flex-shrink-0">
                <Sparkle className="w-8 h-8 text-brown-600 dark:text-brown-400" weight="fill" />
              </div>
              <div
                className="text-sm text-gray-600 dark:text-gray-400 text-left max-w-md w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brown-600 [&_a]:dark:text-brown-400 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(notes) }}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex justify-center">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-brown-600 hover:bg-brown-700 text-white text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
