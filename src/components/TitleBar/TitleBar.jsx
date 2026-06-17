import { useState, useEffect } from 'react'

const MinimizeIcon = () => (
  <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
    <rect width="10" height="1" />
  </svg>
)

const MaximizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="0.5" y="0.5" width="9" height="9" />
  </svg>
)

const RestoreIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="0" y="3" width="8" height="8" />
    <polyline points="3,3 3,0 11,0 11,8 8,8" />
  </svg>
)

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
    <line x1="0" y1="0" x2="10" y2="10" />
    <line x1="10" y1="0" x2="0" y2="10" />
  </svg>
)

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.window.isMaximized().then(setIsMaximized)
    return window.electronAPI.window.onMaximizeChange(setIsMaximized)
  }, [])

  return (
    <div
      className="flex items-center flex-shrink-0 bg-gray-950 select-none"
      style={{ height: 32, WebkitAppRegion: 'drag' }}
    >
      <div className="flex-1 flex items-center px-3.5">
        <span className="text-xs font-medium text-gray-600">Smart Notepad</span>
      </div>

      <div
        className="flex items-stretch h-full"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          onClick={() => window.electronAPI.window.minimize()}
          className="flex items-center justify-center w-11 text-gray-500 hover:text-gray-200 hover:bg-white/[0.08] transition-colors"
          tabIndex={-1}
          aria-label="Minimize"
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={() => window.electronAPI.window.maximize()}
          className="flex items-center justify-center w-11 text-gray-500 hover:text-gray-200 hover:bg-white/[0.08] transition-colors"
          tabIndex={-1}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          onClick={() => window.electronAPI.window.close()}
          className="flex items-center justify-center w-11 text-gray-500 hover:text-white hover:bg-red-600 transition-colors"
          tabIndex={-1}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}
