import { useState, useRef } from 'react'
import { Plus, DotsThree, Pencil, Trash, Check, X } from '@phosphor-icons/react'
import DropdownMenu from '../common/DropdownMenu'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useUIStore } from '../../store/uiStore'
import { useNotesStore } from '../../store/notesStore'

const EMOJI_CATEGORIES = [
  {
    label: 'Work',
    icons: ['📁','📂','🗂️','📋','📌','📍','🏷️','💼','🗃️','📦','📄','📑','🗒️','🗓️','📅','📆','📎','✂️','🖇️','🗑️'],
  },
  {
    label: 'Ideas',
    icons: ['💡','🎯','✨','🔮','💭','🧩','⚡','🌟','💫','🌈','🎪','🎭','🎬','🏆','🥇','🎖️','🏅','🎗️','🎀','🎁'],
  },
  {
    label: 'Tech',
    icons: ['💻','🖥️','📱','⌨️','🖱️','💾','💿','🔌','🔋','📡','🤖','👾','🎮','🕹️','🔧','🔨','⚙️','🛠️','🔩','🧰'],
  },
  {
    label: 'Creative',
    icons: ['🎨','✏️','🖊️','🖋️','📝','🖌️','📐','📏','🎸','🎹','🎵','🎶','🎤','🎧','🎼','📷','📸','🎥','🎞️','🖼️'],
  },
  {
    label: 'Science',
    icons: ['🔬','🔭','🧬','🧪','🧫','🧲','⚗️','🔍','🔎','🧮','🌡️','💉','🩺','🧠','⚕️','🌿','🍃','🌱','🌲','🌍'],
  },
  {
    label: 'Business',
    icons: ['💰','📊','📈','📉','💳','🏦','🏢','🏪','💸','🤑','🛒','🤝','👥','📢','📣','✉️','📧','📞','☎️','📠'],
  },
  {
    label: 'Life',
    icons: ['🏠','🏡','🚀','✈️','🚗','🌆','🏔️','🏝️','☕','🍕','🎂','🍷','🏃','🧘','❤️','💪','🎉','🎊','🌙','☀️'],
  },
]

export default function WorkspaceSection() {
  const workspaces = useWorkspaceStore(s => s.getAll())
  const createWorkspace = useWorkspaceStore(s => s.createWorkspace)
  const updateWorkspace = useWorkspaceStore(s => s.updateWorkspace)
  const deleteWorkspace = useWorkspaceStore(s => s.deleteWorkspace)
  const activeWorkspaceId = useUIStore(s => s.activeWorkspaceId)
  const setActiveWorkspace = useUIStore(s => s.setActiveWorkspace)
  const notes = useNotesStore(s => s.notes)

  const [menuId, setMenuId] = useState(null)
  const menuTriggerRef = useRef(null)
  const [modal, setModal] = useState(null) // { mode: 'create' | 'rename', ws?: workspace }

  const getNoteCount = (wsId) =>
    Object.values(notes).filter(n => n.workspaceId === wsId && !n.trashed && !n.archived).length

  const openCreate = () => setModal({ mode: 'create' })
  const openRename = (ws) => { setModal({ mode: 'rename', ws }); setMenuId(null) }
  const closeModal = () => setModal(null)

  const handleSave = async (name, icon) => {
    if (!name.trim()) return
    if (modal.mode === 'create') {
      const ws = await createWorkspace({ name: name.trim(), icon })
      setActiveWorkspace(ws.id)
    } else {
      updateWorkspace(modal.ws.id, { name: name.trim(), icon })
    }
    closeModal()
  }

  return (
    <div className="space-y-0.5 px-0 py-1">
      {workspaces.map(ws => (
        <div key={ws.id} className="group relative">
          <button
            onClick={() => setActiveWorkspace(ws.id)}
            className={`sidebar-item w-full ${activeWorkspaceId === ws.id ? 'active' : ''}`}
          >
            <span className="text-base leading-none">{ws.icon}</span>
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
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all"
            >
              <DotsThree className="w-4 h-4 text-black" weight="bold" />
            </button>
          </button>

          <DropdownMenu
            anchor={menuTriggerRef}
            open={menuId === ws.id}
            onClose={() => setMenuId(null)}
            align="right"
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-36">
              <button
                onClick={() => openRename(ws)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700"
              >
                <Pencil className="w-4 h-4" weight="duotone" /> Rename
              </button>
              <button
                onClick={() => { deleteWorkspace(ws.id); setMenuId(null) }}
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
            initial={{ name: modal.ws?.name ?? '', icon: modal.ws?.icon ?? '📁' }}
            onSave={handleSave}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkspaceModal({ mode, initial, onSave, onClose }) {
  const [name, setName] = useState(initial.name)
  const [icon, setIcon] = useState(initial.icon)
  const [search, setSearch] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSave(name, icon)
    if (e.key === 'Escape') onClose()
  }

  const filteredCategories = search.trim()
    ? [{ label: 'Results', icons: EMOJI_CATEGORIES.flatMap(c => c.icons).filter(e => e.includes(search)) }]
    : EMOJI_CATEGORIES

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-auto w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              {mode === 'create' ? 'New Workspace' : 'Rename Workspace'}
            </h2>
            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Icon picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Icon</p>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="text-xs px-2 py-1 rounded-lg bg-gray-100 border border-transparent focus:border-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-500/20 w-28 placeholder:text-gray-400"
                />
              </div>
              <div className="h-64 overflow-y-auto space-y-2 pr-1">
                {filteredCategories.map(cat => (
                  <div key={cat.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 sticky top-0 bg-white py-0.5">{cat.label}</p>
                    <div className="grid grid-cols-12 gap-1">
                      {cat.icons.map(e => (
                        <button
                          key={e}
                          onClick={() => setIcon(e)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all hover:scale-110 ${
                            icon === e
                              ? 'bg-brown-100 ring-1 ring-brown-400 scale-110'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCategories[0]?.icons.length === 0 && (
                  <p className="text-xs text-gray-400 text-center pt-8">No icons found</p>
                )}
              </div>
            </div>

            {/* Name input */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Name</p>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                <span className="text-base leading-none">{icon}</span>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Workspace name"
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(name, icon)}
              disabled={!name.trim()}
              className="px-3 py-1.5 text-sm rounded-lg bg-brown-600 hover:bg-brown-700 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
