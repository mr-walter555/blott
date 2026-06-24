import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { X } from '@phosphor-icons/react'
import MainLayout from './pages/MainLayout'
import QuickCapture from './pages/QuickCapture'
import StickyNote from './pages/StickyNote'
import CommandPalette from './components/CommandPalette/CommandPalette'
import SettingsModal from './components/Settings/SettingsModal'
import WhatsNewModal from './components/common/WhatsNewModal'
import NotesListModal from './components/common/NotesListModal'
import TrashModal from './components/Sidebar/TrashModal'
import AskAIModal from './components/AskAI/AskAIModal'
import { useNotesStore } from './store/notesStore'
import { useWorkspaceStore } from './store/workspaceStore'
import { useUIStore } from './store/uiStore'
import { useTheme } from './hooks/useTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useFileDropImport } from './hooks/useFileDropImport'
import { electronService } from './services/electronService'
import TitleBar from './components/TitleBar/TitleBar'

const params = new URLSearchParams(window.location.search)
const isQuickCaptureMode = params.get('mode') === 'quickcapture'
const isStickyMode = params.get('mode') === 'sticky'
const stickyNoteId = params.get('noteId')

function UpdateToast({ t, title, description, primaryLabel, onPrimary, secondaryLabel = 'Dismiss', progress, dismissOnPrimary = true }) {
  return (
    <div className="w-80 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-muted hover:text-gray-600 dark:hover:text-gray-200 -m-1 p-1 rounded-md transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-muted mt-1">{description}</p>
      {progress != null && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-[width] duration-300"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
      )}
      {primaryLabel && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { onPrimary(); if (dismissOnPrimary) toast.dismiss(t.id) }}
            className="px-3 py-1.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {primaryLabel}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-muted text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {secondaryLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  useTheme()
  useKeyboardShortcuts()
  useFileDropImport()

  const initNotes = useNotesStore(s => s.init)
  const addNoteFromExternal = useNotesStore(s => s.addNoteFromExternal)
  const refreshNotes = useNotesStore(s => s.refreshNotes)
  const setSelectedNote = useNotesStore(s => s.setSelectedNote)
  const initWorkspaces = useWorkspaceStore(s => s.init)
  const commandPaletteOpen = useUIStore(s => s.commandPaletteOpen)
  const settingsOpen = useUIStore(s => s.settingsOpen)
  const askAIOpen = useUIStore(s => s.askAIOpen)
  const askAILayout = useUIStore(s => s.askAILayout)
  const notesListView = useUIStore(s => s.notesListView)
  const closeNotesList = useUIStore(s => s.closeNotesList)
  const setUpdateStatus = useUIStore(s => s.setUpdateStatus)
  const openSettings = useUIStore(s => s.openSettings)

  const [whatsNew, setWhatsNew] = useState(null)

  useEffect(() => {
    initNotes()
    initWorkspaces()
  }, [initNotes, initWorkspaces])

  // Shows release notes once, on the first launch after an update installs.
  useEffect(() => {
    if (!electronService.isElectron) return

    window.electronAPI.app.getWhatsNew().then(result => {
      if (!result?.version) return
      setWhatsNew(result)
    })
  }, [])

  // Notes saved from the global Quick Capture popup (Alt+Space) land here live,
  // so they show up without the user having to reload or navigate.
  useEffect(() => {
    if (!electronService.isElectron) return

    return window.electronAPI.onNoteCreated(note => {
      addNoteFromExternal(note)
      toast.success('Note captured')
    })
  }, [addNoteFromExternal])

  // Quick Capture (and sticky notes) can save notes while this window is
  // unfocused or wasn't open to receive the live push — catch up whenever
  // the main window regains focus, same as "refetch on window focus".
  useEffect(() => {
    if (!electronService.isElectron) return

    const handleFocus = () => refreshNotes()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshNotes])

  // "Edit" from a floating sticky note brings the main window to the front
  // and asks it to open that note in the full editor.
  useEffect(() => {
    if (!electronService.isElectron) return

    return window.electronAPI.onOpenInMain(noteId => {
      setSelectedNote(noteId)
    })
  }, [setSelectedNote])

  // Notes edited directly in a floating sticky note are saved by the main
  // process, but this window's store needs telling so the sidebar/editor
  // reflect those edits too.
  useEffect(() => {
    if (!electronService.isElectron) return

    return window.electronAPI.onNoteUpdated(note => {
      addNoteFromExternal(note)
    })
  }, [addNoteFromExternal])

  // Registered once for the app's lifetime so a silent update check on launch
  // (before any UI is listening) still reaches the user — Settings only shows
  // this status while it's open.
  useEffect(() => {
    if (!electronService.isElectron) return

    const showDownloadingToast = (percent) => toast.custom(t => (
      <UpdateToast
        t={t}
        title="Downloading update…"
        description="Blott will be ready to install when this finishes."
        progress={percent}
      />
    ), { id: 'update-status', duration: Infinity })

    return window.electronAPI.updater.onStatus(status => {
      setUpdateStatus(status)
      if (status.status === 'available') {
        toast.custom(t => (
          <UpdateToast
            t={t}
            title={`Update available – v${status.version}`}
            description="A new version of Blott is ready to download."
            primaryLabel="Download"
            dismissOnPrimary={false}
            onPrimary={() => {
              setUpdateStatus(s => ({ ...s, status: 'downloading', percent: 0 }))
              window.electronAPI.updater.download()
              showDownloadingToast(0)
            }}
            secondaryLabel="Dismiss"
          />
        ), { id: 'update-status', duration: Infinity })
      } else if (status.status === 'downloading') {
        showDownloadingToast(status.percent ?? 0)
      } else if (status.status === 'downloaded') {
        toast.custom(t => (
          <UpdateToast
            t={t}
            title={`Update ready – v${status.version}`}
            description="Restart now to install the latest version."
            primaryLabel="Restart & Install"
            onPrimary={() => window.electronAPI.updater.install()}
            secondaryLabel="Later"
          />
        ), { id: 'update-status', duration: Infinity })
      }
    })
  }, [setUpdateStatus])

  if (isQuickCaptureMode) {
    return <QuickCapture />
  }

  if (isStickyMode && stickyNoteId) {
    return <StickyNote noteId={stickyNoteId} />
  }

  const isWin32 = electronService.isElectron && window.electronAPI?.platform === 'win32'

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      {isWin32 && <TitleBar />}
      <MainLayout />
      {/* AskAIModal is always mounted so conversation state survives open/close cycles */}
      <AskAIModal />
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette key="cmd-palette" />}
        {settingsOpen && <SettingsModal key="settings" />}
        {notesListView === 'Trash2' && (
          <TrashModal key="Trash2-modal" anchorY={96} onClose={closeNotesList} />
        )}
        {notesListView && notesListView !== 'Trash2' && (
          <NotesListModal key="notes-list" view={notesListView} onClose={closeNotesList} />
        )}
        {whatsNew && (
          <WhatsNewModal
            key="whats-new"
            version={whatsNew.version}
            onClose={() => setWhatsNew(null)}
          />
        )}
      </AnimatePresence>
      <Toaster
        position={askAIOpen && askAILayout === 'floating' ? 'top-right' : 'bottom-right'}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '13px',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          },
          success: { iconTheme: { primary: '#b45309', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
