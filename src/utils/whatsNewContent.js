// Short, hand-written list of highlights shown once in the in-app "What's new"
// modal after an update. Kept separate from the GitHub release notes, which are
// written for the releases page (download tables, SmartScreen instructions,
// contributor avatars) and aren't meant for a small in-app dialog.
//
// Update this alongside each release to describe what's new since the last
// version.
import { Note, CloudArrowDown } from '@phosphor-icons/react'

export const WHATS_NEW_ITEMS = [
  {
    icon: Note,
    title: 'Sticky notes are back',
    description: 'Pop any note out into a small always-on-top window from its menu, just like the old sticky notes.',
  },
  {
    icon: CloudArrowDown,
    title: 'Quieter updates',
    description: "Restarting to install an update no longer shows the installer wizard — it just installs and reopens Smart Notepad.",
  },
]
