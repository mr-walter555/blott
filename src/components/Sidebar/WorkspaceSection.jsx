import { useState, useRef } from 'react'
import { Plus, DotsThree, Pencil, Trash, X, Warning } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import DropdownMenu from '../common/DropdownMenu'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'
import WorkspaceNotesModal from './WorkspaceNotesModal'

const DEFAULT_COLOR = '#b45309'

const PALETTE = [
  '#b45309', '#6366f1', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#6b7280', '#1d4ed8',
]

function WorkspaceAvatar({ name, color, size = 'sm' }) {
  const letter = (name || '?')[0].toUpperCase()
  const sz = size === 'sm' ? 'w-5 h-5 text-[11px]' : 'w-8 h-8 text-sm'
  return (
    <div
      className={`${sz} rounded-md flex items-center justify-center font-semibold flex-shrink-0`}
      style={{ background: (color || '#6b7280') + '20', color: color || '#6b7280' }}
    >
      {letter}
    </div>
  )
}

export default function WorkspaceSection() {
  const workspaces      = useWorkspaceStore(s => s.getAll())
  const createWorkspace = useWorkspaceStore(s => s.createWorkspace)
  const updateWorkspace = useWorkspaceStore(s => s.updateWorkspace)
  const deleteWorkspace = useWorkspaceStore(s => s.deleteWorkspace)
  const activeWorkspaceId = useUIStore(s => s.activeWorkspaceId)
  const setActiveWorkspace = useUIStore(s => s.setActiveWorkspace)
  const notes = useNotesStore(s => s.notes)

  const [menuId, setMenuId]               = useState(null)
  const [wsModal, setWsModal]             = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const menuTriggerRef = useRef(null)
  const [modal, setModal] = useState(null)

  const getNoteCount = (wsId) =>
    Object.values(notes).filter(n => n.workspaceId === wsId && !n.trashed && !n.archived).length

  const openCreate = ()   => setModal({ mode: 'create' })
  const openRename = (ws) => { setModal({ mode: 'rename', ws }); setMenuId(null) }
  const closeModal = ()   => setModal(null)

  const handleSave = async (name, color, description) => {
    if (!name.trim()) return
    if (modal.mode === 'create') {
      const ws = await createWorkspace({ name: name.trim(), color, description: description.trim() })
      setActiveWorkspace(ws.id)
      toast.success(`Workspace "${name.trim()}" created`)
    } else {
      updateWorkspace(modal.ws.id, { name: name.trim(), color, description: description.trim() })
      toast.success('Workspace updated')
    }
    closeModal()
  }

  const handleDelete = (ws) => {
    deleteWorkspace(ws.id)
    setConfirmDeleteId(null)
    setMenuId(null)
    toast.error(`"${ws.name}" deleted`)
  }

  return (
    <div className="space-y-0.5 px-0 py-1">
      {workspaces.map(ws => (
        <div key={ws.id} className="group relative">
          {/* Delete confirmation inline */}
          {confirmDeleteId === ws.id ? (
            <div className="mx-1 my-0.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
              <Warning className="w-3.5 h-3.5 text-red-500 flex-shrink-0" weight="fill" />
              <span className="flex-1 text-xs text-red-700">Delete "{ws.name}"?</span>
              <button
                onClick={() => handleDelete(ws)}
                className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-2 py-0.5 rounded-md text-xs text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={e => setWsModal({ workspace: ws, anchorY: e.currentTarget.getBoundingClientRect().top })}
              className="sidebar-item w-full"
            >
              <WorkspaceAvatar name={ws.name} color={ws.color} />
              <span className="flex-1 text-left truncate">{ws.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {getNoteCount(ws.id) || ''}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  menuTriggerRef.current = e.currentTarget
                  setMenuId(menuId === ws.id ? null : ws.id)
                }}
                className="opacity-20 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all"
              >
                <DotsThree className="w-4 h-4 text-black" weight="bold" />
              </button>
            </button>
          )}

          <DropdownMenu anchor={menuTriggerRef} open={menuId === ws.id} onClose={() => setMenuId(null)} align="right">
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-36">
              <button onClick={() => openRename(ws)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">
                <Pencil className="w-4 h-4" weight="duotone" /> Rename
              </button>
              <button
                onClick={() => { setConfirmDeleteId(ws.id); setMenuId(null) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 text-red-500"
              >
                <Trash className="w-4 h-4" /> Delete
              </button>
            </div>
          </DropdownMenu>
        </div>
      ))}

      <button
        onClick={openCreate}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5 flex-shrink-0" />
        Add workspace
      </button>

      <AnimatePresence>
        {modal && (
          <WorkspaceModal
            mode={modal.mode}
            initial={{ name: modal.ws?.name ?? '', color: modal.ws?.color ?? DEFAULT_COLOR, description: modal.ws?.description ?? '' }}
            onSave={handleSave}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {wsModal && (
        <WorkspaceNotesModal
          workspace={wsModal.workspace}
          anchorY={wsModal.anchorY}
          onClose={() => setWsModal(null)}
        />
      )}
    </div>
  )
}

function WorkspaceModal({ mode, initial, onSave, onClose }) {
  const [name, setName]               = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [color, setColor]             = useState(initial.color || DEFAULT_COLOR)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.1 }}
          className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              {mode === 'create' ? 'New Workspace' : 'Edit Workspace'}
            </h2>
            <button onClick={onClose} className="btn-icon">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* Preview + Name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-brown-400/30 focus-within:border-brown-300 transition-all">
                <WorkspaceAvatar name={name || '?'} color={color} size="lg" />
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Workspace name"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{ background: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What is this workspace for?"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brown-400/30 focus:border-brown-300 transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSave(name, color, description)}
              disabled={!name.trim()}
              className="px-4 py-1.5 text-sm rounded-lg bg-brown-600 hover:bg-brown-700 text-white font-medium transition-colors disabled:opacity-40"
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
