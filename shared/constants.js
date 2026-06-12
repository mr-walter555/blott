const NOTE_COLORS = {
  default: { label: 'Default', bg: 'transparent', border: 'transparent', dark: 'transparent' },
  yellow: { label: 'Yellow', bg: '#fef9c3', border: '#fef08a', dark: '#713f12' },
  blue: { label: 'Blue', bg: '#dbeafe', border: '#bfdbfe', dark: '#1e3a5f' },
  green: { label: 'Green', bg: '#dcfce7', border: '#bbf7d0', dark: '#14532d' },
  pink: { label: 'Pink', bg: '#fce7f3', border: '#fbcfe8', dark: '#831843' },
  purple: { label: 'Purple', bg: '#ede9fe', border: '#ddd6fe', dark: '#4c1d95' },
  orange: { label: 'Orange', bg: '#ffedd5', border: '#fed7aa', dark: '#7c2d12' },
  red: { label: 'Red', bg: '#fee2e2', border: '#fecaca', dark: '#7f1d1d' },
}

const DEFAULT_WORKSPACES = [
  { id: 'personal', name: 'Personal', icon: '🏠', color: '#6366f1' },
  { id: 'work', name: 'Work', icon: '💼', color: '#0ea5e9' },
  { id: 'projects', name: 'Projects', icon: '🚀', color: '#10b981' },
  { id: 'ideas', name: 'Ideas', icon: '💡', color: '#f59e0b' },
]

const AI_ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: '✦', description: 'Condense to key points' },
  { id: 'rewrite', label: 'Rewrite Professionally', icon: '✎', description: 'Professional tone' },
  { id: 'grammar', label: 'Fix Grammar', icon: '✓', description: 'Correct errors' },
  { id: 'bullets', label: 'Convert to Bullets', icon: '≡', description: 'Make a list' },
  { id: 'actions', label: 'Extract Action Items', icon: '◎', description: 'Find tasks' },
  { id: 'expand', label: 'Expand', icon: '⤢', description: 'Add more detail' },
  { id: 'simplify', label: 'Simplify', icon: '◈', description: 'Make simpler' },
]

const BACKEND_PORT = 3001
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`

const FONT_SIZES = {
  small: { label: 'Small', class: 'text-sm', editorSize: '14px' },
  medium: { label: 'Medium', class: 'text-base', editorSize: '16px' },
  large: { label: 'Large', class: 'text-lg', editorSize: '18px' },
}

module.exports = { NOTE_COLORS, DEFAULT_WORKSPACES, AI_ACTIONS, BACKEND_PORT, BACKEND_URL, FONT_SIZES }
