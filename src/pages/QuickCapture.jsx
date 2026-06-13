import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Sparkle, X } from '@phosphor-icons/react'
import { useTheme } from '../hooks/useTheme'
import { markdownToHtml } from '../utils/markdownToHtml'

// Keep in sync with QUICK_CAPTURE_HEIGHT / QUICK_CAPTURE_MAX_HEIGHT in electron/main.js
const MIN_HEIGHT = 180
const MAX_HEIGHT = 480
const LINE_HEIGHT = 28

export default function QuickCapture() {
  useTheme()

  const [value, setValue] = useState('')
  const containerRef = useRef(null)
  const textareaRef = useRef(null)
  const headerRef = useRef(null)
  const footerRef = useRef(null)

  // Grows/shrinks the popup to fit the current text, animating both the
  // window (via IPC) and the page itself in lockstep.
  const resize = () => {
    const container = containerRef.current
    const textarea = textareaRef.current
    if (!container || !textarea) return

    textarea.style.height = '0px'
    const contentHeight = textarea.scrollHeight
    textarea.style.height = ''

    const chrome = (headerRef.current?.offsetHeight ?? 0) + (footerRef.current?.offsetHeight ?? 0)
    const target = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, chrome + contentHeight))

    gsap.to(container, {
      height: target,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => window.electronAPI?.quickCapture?.resize(container.getBoundingClientRect().height),
    })
  }

  const focus = () => {
    setValue('')
    if (containerRef.current) {
      gsap.killTweensOf(containerRef.current)
      gsap.set(containerRef.current, { height: MIN_HEIGHT })
    }
    window.electronAPI?.quickCapture?.resize(MIN_HEIGHT)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const submit = () => {
    const text = textareaRef.current?.value ?? ''
    if (text.trim()) {
      window.electronAPI?.quickCapture?.save(markdownToHtml(text))
    } else {
      window.electronAPI?.quickCapture?.close()
    }
    setValue('')
  }

  const discard = () => {
    setValue('')
    window.electronAPI?.quickCapture?.close()
  }

  useEffect(() => {
    focus()
    if (!window.electronAPI?.quickCapture) return

    const unsubShow = window.electronAPI.quickCapture.onShow(focus)
    const unsubDismiss = window.electronAPI.quickCapture.onDismiss(submit)

    return () => {
      unsubShow()
      unsubDismiss()
    }
  }, [])

  const handleChange = (e) => {
    setValue(e.target.value)
    resize()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      discard()
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-screen flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-amber-200/70 dark:border-amber-900/40 bg-[#fdf6e3] dark:bg-[#241f1a]"
      style={{ height: MIN_HEIGHT }}
    >
      {/* Drag handle / title bar — styled like a notebook label tab */}
      <div
        ref={headerRef}
        className="flex items-center justify-between px-4 py-2 bg-amber-100/70 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 cursor-grab active:cursor-grabbing select-none"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <div className="flex items-center gap-2">
          <Sparkle className="w-3.5 h-3.5 text-amber-500" weight="fill" />
          <span
            className="text-xs font-semibold tracking-wide text-amber-800/80 dark:text-amber-400/80"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Quick Capture
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={discard}
            className="w-5 h-5 rounded-full bg-red-400 hover:bg-red-500 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-2.5 h-2.5 text-red-900" />
          </button>
        </div>
      </div>

      {/* Page — ruled paper with a margin line, like a notebook sheet */}
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute inset-0 pointer-events-none dark:hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${LINE_HEIGHT - 1}px, rgba(96, 121, 232, 0.14) ${LINE_HEIGHT}px)`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${LINE_HEIGHT - 1}px, rgba(255, 255, 255, 0.06) ${LINE_HEIGHT}px)`,
          }}
        />
        <div className="absolute top-0 bottom-0 left-10 w-px bg-red-300/50 dark:bg-red-500/25 pointer-events-none" />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Capture a quick note…"
          className="absolute inset-0 resize-none bg-transparent pl-12 pr-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none overflow-y-auto"
          style={{ WebkitAppRegion: 'no-drag', userSelect: 'text', lineHeight: `${LINE_HEIGHT}px` }}
          autoFocus
        />
      </div>

      {/* Footer */}
      <div
        ref={footerRef}
        className="px-4 py-1.5 border-t border-amber-200/40 dark:border-amber-900/30 text-[11px] italic text-amber-700/50 dark:text-amber-400/40 select-none"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Enter to save · Esc to dismiss
      </div>
    </div>
  )
}
