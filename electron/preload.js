const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    create: (data) => ipcRenderer.invoke('notes:create', data),
    update: (id, updates) => ipcRenderer.invoke('notes:update', id, updates),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
  },

  workspaces: {
    getAll: () => ipcRenderer.invoke('workspaces:getAll'),
    create: (data) => ipcRenderer.invoke('workspaces:create', data),
    update: (id, updates) => ipcRenderer.invoke('workspaces:update', id, updates),
    delete: (id) => ipcRenderer.invoke('workspaces:delete', id),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (data) => ipcRenderer.invoke('settings:set', data),
  },

  encryption: {
    getStatus: () => ipcRenderer.invoke('encryption:status'),
  },

  ai: {
    status: () => ipcRenderer.invoke('ai:status'),
    processText: (action, text) => ipcRenderer.invoke('ai:processText', action, text),
    askNotes: (question, notes, history) => ipcRenderer.invoke('ai:askNotes', question, notes, history),
  },

  floating: {
    open: (noteId) => ipcRenderer.invoke('floating:open', noteId),
    close: (noteId) => ipcRenderer.invoke('floating:close', noteId),
  },

  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    setNative: (setting) => ipcRenderer.invoke('theme:setNative', setting),
    onChange: (callback) => {
      const handler = (_, theme) => callback(theme)
      ipcRenderer.on('theme:changed', handler)
      return () => ipcRenderer.removeListener('theme:changed', handler)
    },
  },

  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
    openDataFolder: () => ipcRenderer.invoke('app:openDataFolder'),
    setOpenAtLogin: (value) => ipcRenderer.invoke('app:setOpenAtLogin', value),
    getWhatsNew: () => ipcRenderer.invoke('app:getWhatsNew'),
  },

  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatus: (callback) => {
      const handler = (_, status) => callback(status)
      ipcRenderer.on('updater:status', handler)
      return () => ipcRenderer.removeListener('updater:status', handler)
    },
  },

  onNoteUpdated: (callback) => {
    const handler = (_, note) => callback(note)
    ipcRenderer.on('note:updated', handler)
    return () => ipcRenderer.removeListener('note:updated', handler)
  },
})
