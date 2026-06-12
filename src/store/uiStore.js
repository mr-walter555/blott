import { create } from 'zustand'

export const FONT_FAMILIES = {
  sora:  { label: 'Sora',  value: "'Sora Variable', sans-serif" },
  serif: { label: 'Serif', value: "Georgia, Cambria, 'Times New Roman', serif" },
  mono:  { label: 'Mono',  value: "ui-monospace, 'Cascadia Code', 'Segoe UI Mono', Consolas, monospace" },
}

const AI_LAYOUT_KEY = 'sn_ask_ai_layout'
const AI_LAYOUTS = ['sidebar', 'floating']
function loadAILayout() {
  try {
    const v = localStorage.getItem(AI_LAYOUT_KEY)
    return AI_LAYOUTS.includes(v) ? v : 'floating'
  } catch { return 'floating' }
}

export const useUIStore = create((set, get) => ({
  theme: 'light',
  resolvedTheme: 'light',
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  settingsOpen: false,
  askAIOpen: false,
  askAILayout: loadAILayout(),
  activeView: 'all',
  activeWorkspaceId: null,
  searchQuery: '',
  fontSize: 'medium',
  autoSaveInterval: 2000,
  fontFamily: 'sora',
  focusMode: false,
  updateStatus: null,

  setTheme: (theme) => set({ theme }),
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openAskAI: () => set({ askAIOpen: true, commandPaletteOpen: false }),
  closeAskAI: () => set({ askAIOpen: false }),
  setAskAILayout: (id) => {
    if (!AI_LAYOUTS.includes(id)) return
    set({ askAILayout: id })
    try { localStorage.setItem(AI_LAYOUT_KEY, id) } catch {}
  },
  setActiveView: (view) => set({ activeView: view, activeWorkspaceId: null }),
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id, activeView: 'workspace' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setAutoSaveInterval: (ms) => set({ autoSaveInterval: ms }),
  toggleFocusMode: () => set(s => ({ focusMode: !s.focusMode })),
  // Accepts either a status object or a React-style updater (prev => next),
  // since update progress is applied as `s => ({ ...s, percent })`.
  setUpdateStatus: (update) => set(s => ({
    updateStatus: typeof update === 'function' ? update(s.updateStatus) : update,
  })),

  applySettings: (settings) => set({
    theme: settings.theme ?? 'system',
    fontSize: settings.fontSize ?? 'medium',
    autoSaveInterval: settings.autoSaveInterval ?? 2000,
    fontFamily: settings.fontFamily ?? 'sora',
  }),
}))
