export const electronService = {
  isElectron: typeof window !== 'undefined' && !!window.electronAPI?.isElectron,
}
