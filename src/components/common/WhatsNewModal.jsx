import { motion } from 'framer-motion'
import { X, Sparkle } from '@phosphor-icons/react'
import { MODAL_BACKDROP, MODAL_CONTENT } from '../../utils/motionPresets'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { WHATS_NEW_ITEMS } from '../../utils/whatsNewContent'

export default function WhatsNewModal({ version, onClose }) {
  const dialogRef = useFocusTrap()

  return (
    <>
      <motion.div
        {...MODAL_BACKDROP}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <motion.div
          {...MODAL_CONTENT}
          className="pointer-events-auto w-full max-w-md"
        >
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="whats-new-title" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-5">
              <button onClick={onClose} className="btn-icon absolute top-4 right-4" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-brown-600 flex items-center justify-center mb-3">
                <Sparkle className="w-5 h-5 text-white" />
              </div>
              <h2 id="whats-new-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">What's new in v{version}</h2>
              <p className="text-xs text-muted mt-0.5">A couple of small improvements since your last update</p>
            </div>

            {/* Highlights */}
            <div className="px-6 pb-2 space-y-4 max-h-[45vh] overflow-y-auto">
              {WHATS_NEW_ITEMS.map(({ icon: Icon, title, description, shortcut }, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brown-50 dark:bg-brown-950/40 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brown-600 dark:text-brown-400" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                      {shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-muted border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          {shortcut}
                        </kbd>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-sm font-medium transition-colors"
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
