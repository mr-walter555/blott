const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback) => {
      const handler = (_, maximized) => callback(maximized)
      ipcRenderer.on('window:maximized', handler)
      return () => ipcRenderer.removeListener('window:maximized', handler)
    },
  },

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
    askNotesStream: (requestId, question, notes, history) =>
      ipcRenderer.send('ai:askNotes:stream', { requestId, question, notes, history }),
    onStreamToken: (requestId, callback) => {
      const handler = (_, token) => callback(token)
      ipcRenderer.on(`ai:stream:token:${requestId}`, handler)
      return () => ipcRenderer.removeListener(`ai:stream:token:${requestId}`, handler)
    },
    onStreamDone: (requestId, callback) => {
      const handler = (_, data) => callback(data)
      ipcRenderer.on(`ai:stream:done:${requestId}`, handler)
      return () => ipcRenderer.removeListener(`ai:stream:done:${requestId}`, handler)
    },
    onStreamError: (requestId, callback) => {
      const handler = (_, error) => callback(error)
      ipcRenderer.on(`ai:stream:error:${requestId}`, handler)
      return () => ipcRenderer.removeListener(`ai:stream:error:${requestId}`, handler)
    },
  },

  floating: {
    open: (noteId) => ipcRenderer.invoke('floating:open', noteId),
    close: (noteId) => ipcRenderer.invoke('floating:close', noteId),
    setHeight: (noteId, height, minH) => ipcRenderer.invoke('floating:setHeight', noteId, height, minH),
    editInMain: (noteId) => ipcRenderer.invoke('floating:editInMain', noteId),
  },

  quickCapture: {
    save: (content) => ipcRenderer.invoke('quickCapture:save', content),
    close: () => ipcRenderer.invoke('quickCapture:close'),
    resize: (height) => ipcRenderer.send('quickCapture:resize', height),
    onShow: (callback) => {
      const handler = () => callback()
      ipcRenderer.on('quickCapture:shown', handler)
      return () => ipcRenderer.removeListener('quickCapture:shown', handler)
    },
    onDismiss: (callback) => {
      const handler = () => callback()
      ipcRenderer.on('quickCapture:dismiss', handler)
      return () => ipcRenderer.removeListener('quickCapture:dismiss', handler)
    },
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

  onNoteCreated: (callback) => {
    const handler = (_, note) => callback(note)
    ipcRenderer.on('notes:created', handler)
    return () => ipcRenderer.removeListener('notes:created', handler)
  },

  onNoteUpdated: (callback) => {
    const handler = (_, note) => callback(note)
    ipcRenderer.on('note:updated', handler)
    return () => ipcRenderer.removeListener('note:updated', handler)
  },

  onOpenInMain: (callback) => {
    const handler = (_, noteId) => callback(noteId)
    ipcRenderer.on('notes:openInMain', handler)
    return () => ipcRenderer.removeListener('notes:openInMain', handler)
  },
})
