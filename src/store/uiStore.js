import { create } from 'zustand'

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
  fontFamily: 'Sora Variable',
  focusMode: false,

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
  setAutoSaveInterval: (ms) => set({ autoSaveInterval: ms }),
  toggleFocusMode: () => set(s => ({ focusMode: !s.focusMode })),

  applySettings: (settings) => set({
    theme: settings.theme ?? 'system',
    fontSize: settings.fontSize ?? 'medium',
    autoSaveInterval: settings.autoSaveInterval ?? 2000,
    fontFamily: settings.fontFamily ?? 'Sora Variable',
  }),
}))
