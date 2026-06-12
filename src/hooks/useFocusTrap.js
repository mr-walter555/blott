import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Keeps Tab/Shift+Tab cycling within a modal/dialog while it's mounted, moves
// focus inside it on open, and restores the previously focused element on close.
export function useFocusTrap(active = true) {
  const containerRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    previousFocusRef.current = document.activeElement

    if (!container.contains(document.activeElement)) {
      container.querySelector(FOCUSABLE_SELECTOR)?.focus()
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [active])

  return containerRef
}
