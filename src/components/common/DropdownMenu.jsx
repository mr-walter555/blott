import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Portal-based dropdown that escapes any overflow:hidden/scroll ancestor.
 *
 * Props:
 *   anchor      – ref object whose .current is the trigger element
 *   open        – boolean
 *   onClose     – called on outside click or Escape
 *   align       – 'left' (default) | 'right' — which edge of the anchor to align to
 *   matchWidth  – stretch the menu to the anchor's width (default false)
 *   children    – the menu content (already styled panel)
 */
export default function DropdownMenu({ anchor, open, onClose, children, align = 'left', matchWidth = false }) {
  const menuRef = useRef(null)

  // Position synchronously before paint to avoid flicker
  useLayoutEffect(() => {
    if (!open || !menuRef.current) return
    const el = anchor?.current
    if (!el) return

    const menu = menuRef.current
    const rect = el.getBoundingClientRect()

    if (matchWidth) menu.style.width = rect.width + 'px'

    // measure after optional width set
    const mRect = menu.getBoundingClientRect()

    let top = rect.bottom + 4
    let left = align === 'right' ? rect.right - mRect.width : rect.left

    // clamp horizontally
    if (left + mRect.width > window.innerWidth - 8) left = window.innerWidth - mRect.width - 8
    if (left < 8) left = 8

    // flip above if not enough room below
    if (top + mRect.height > window.innerHeight - 8) top = rect.top - mRect.height - 4

    menu.style.top = top + 'px'
    menu.style.left = left + 'px'
    menu.style.visibility = 'visible'
  }, [open, align, matchWidth])

  // Outside click + Escape to close
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !anchor?.current?.contains(e.target)) {
        onClose()
      }
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, anchor])

  if (!open) return null

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', zIndex: 9999, visibility: 'hidden' }}
      className="animate-fade-in"
    >
      {children}
    </div>,
    document.body
  )
}
