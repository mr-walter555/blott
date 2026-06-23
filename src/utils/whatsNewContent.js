// Short, hand-written list of highlights shown once in the in-app "What's new"
// modal after an update. Kept separate from the GitHub release notes, which are
// written for the releases page (download tables, SmartScreen instructions,
// contributor avatars) and aren't meant for a small in-app dialog.
//
// Update this alongside each release to describe what's new since the last
// version.
import { AppWindow, FileArrowDown, ArrowSquareOut, Bell } from '@phosphor-icons/react'

export const WHATS_NEW_ITEMS = [
  {
    icon: AppWindow,
    title: 'Fresh new look',
    description: 'Custom title bar, Geist font, and a tighter editor column — the app feels more at home on your Monitor.',
  },
  {
    icon: FileArrowDown,
    title: 'Drag-and-drop import',
    description: 'Drop a .txt or .md file anywhere on the window to import it as a new note instantly.',
  },
  {
    icon: ArrowSquareOut,
    title: 'Ctrl+click to open links',
    description: 'Hold Ctrl and click any link in a note to open it in your browser — plain clicks still let you edit.',
  },
  {
    icon: Bell,
    title: 'Monitor notifications',
    description: 'Quick Capture and update alerts now show native OS notifications when blott is in the background.',
  },
]
