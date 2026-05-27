import { create } from 'zustand'
import { electronService } from '../services/electronService'
import { v4 as uuidv4 } from 'uuid'

const FALLBACK_KEY = 'sn_workspaces'

const DEFAULT = [
  { id: 'personal', name: 'Personal', icon: '🏠', color: '#6366f1' },
  { id: 'work', name: 'Work', icon: '💼', color: '#0ea5e9' },
  { id: 'projects', name: 'Projects', icon: '🚀', color: '#10b981' },
  { id: 'ideas', name: 'Ideas', icon: '💡', color: '#f59e0b' },
]

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(FALLBACK_KEY) || 'null')
    if (data) return data
    const defaults = {}
    DEFAULT.forEach(ws => { defaults[ws.id] = { ...ws, createdAt: new Date().toISOString() } })
    return defaults
  } catch {
    return {}
  }
}

function saveLocal(workspaces) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(workspaces))
  } catch {}
}

export const useWorkspaceStore = create((set, get) => ({
  workspaces: {},

  init: async () => {
    try {
      let list = []
      if (electronService.isElectron) {
        list = await window.electronAPI.workspaces.getAll()
      } else {
        list = Object.values(loadLocal())
      }
      const workspaces = {}
      list.forEach(ws => { workspaces[ws.id] = ws })
      set({ workspaces })
    } catch {
      set({ workspaces: loadLocal() })
    }
  },

  createWorkspace: async (data) => {
    const ws = {
      id: uuidv4(),
      name: 'New Workspace',
      icon: '📁',
      color: '#6366f1',
      createdAt: new Date().toISOString(),
      ...data,
    }

    if (electronService.isElectron) {
      const created = await window.electronAPI.workspaces.create(ws)
      set(s => ({ workspaces: { ...s.workspaces, [created.id]: created } }))
      return created
    } else {
      const local = loadLocal()
      local[ws.id] = ws
      saveLocal(local)
      set(s => ({ workspaces: { ...s.workspaces, [ws.id]: ws } }))
      return ws
    }
  },

  updateWorkspace: async (id, updates) => {
    const updated = { ...get().workspaces[id], ...updates }
    set(s => ({ workspaces: { ...s.workspaces, [id]: updated } }))
    if (electronService.isElectron) {
      await window.electronAPI.workspaces.update(id, updates)
    } else {
      const local = loadLocal()
      local[id] = updated
      saveLocal(local)
    }
  },

  deleteWorkspace: async (id) => {
    set(s => {
      const ws = { ...s.workspaces }
      delete ws[id]
      return { workspaces: ws }
    })
    if (electronService.isElectron) {
      await window.electronAPI.workspaces.delete(id)
    } else {
      const local = loadLocal()
      delete local[id]
      saveLocal(local)
    }
  },

  getAll: () => Object.values(get().workspaces).sort((a, b) => {
    const order = ['personal', 'work', 'projects', 'ideas']
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return new Date(a.createdAt) - new Date(b.createdAt)
  }),
}))
