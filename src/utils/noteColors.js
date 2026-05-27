export const NOTE_COLORS = {
  default: {
    label: 'Default',
    swatch: null,
    card: '',
    cardDark: '',
  },
  yellow: {
    label: 'Yellow',
    swatch: '#fde047',
    card: 'bg-yellow-50 border-yellow-200',
    cardDark: 'dark:bg-yellow-950/30 dark:border-yellow-800/50',
  },
  blue: {
    label: 'Blue',
    swatch: '#60a5fa',
    card: 'bg-blue-50 border-blue-200',
    cardDark: 'dark:bg-blue-950/30 dark:border-blue-800/50',
  },
  green: {
    label: 'Green',
    swatch: '#4ade80',
    card: 'bg-green-50 border-green-200',
    cardDark: 'dark:bg-green-950/30 dark:border-green-800/50',
  },
  pink: {
    label: 'Pink',
    swatch: '#f472b6',
    card: 'bg-pink-50 border-pink-200',
    cardDark: 'dark:bg-pink-950/30 dark:border-pink-800/50',
  },
  purple: {
    label: 'Purple',
    swatch: '#a78bfa',
    card: 'bg-purple-50 border-purple-200',
    cardDark: 'dark:bg-purple-950/30 dark:border-purple-800/50',
  },
  orange: {
    label: 'Orange',
    swatch: '#fb923c',
    card: 'bg-orange-50 border-orange-200',
    cardDark: 'dark:bg-orange-950/30 dark:border-orange-800/50',
  },
  red: {
    label: 'Red',
    swatch: '#f87171',
    card: 'bg-red-50 border-red-200',
    cardDark: 'dark:bg-red-950/30 dark:border-red-800/50',
  },
  rose: {
    label: 'Rose',
    swatch: '#fb7185',
    card: 'bg-rose-50 border-rose-200',
    cardDark: 'dark:bg-rose-950/30 dark:border-rose-800/50',
  },
  amber: {
    label: 'Amber',
    swatch: '#fbbf24',
    card: 'bg-amber-50 border-amber-200',
    cardDark: 'dark:bg-amber-950/30 dark:border-amber-800/50',
  },
  lime: {
    label: 'Lime',
    swatch: '#a3e635',
    card: 'bg-lime-50 border-lime-200',
    cardDark: 'dark:bg-lime-950/30 dark:border-lime-800/50',
  },
  teal: {
    label: 'Teal',
    swatch: '#2dd4bf',
    card: 'bg-teal-50 border-teal-200',
    cardDark: 'dark:bg-teal-950/30 dark:border-teal-800/50',
  },
  cyan: {
    label: 'Cyan',
    swatch: '#22d3ee',
    card: 'bg-cyan-50 border-cyan-200',
    cardDark: 'dark:bg-cyan-950/30 dark:border-cyan-800/50',
  },
  indigo: {
    label: 'Indigo',
    swatch: '#818cf8',
    card: 'bg-indigo-50 border-indigo-200',
    cardDark: 'dark:bg-indigo-950/30 dark:border-indigo-800/50',
  },
  slate: {
    label: 'Slate',
    swatch: '#94a3b8',
    card: 'bg-slate-100 border-slate-300',
    cardDark: 'dark:bg-slate-800/40 dark:border-slate-700/50',
  },
}

export function getColorClasses(color) {
  const c = NOTE_COLORS[color] || NOTE_COLORS.default
  return [c.card, c.cardDark].filter(Boolean).join(' ')
}
