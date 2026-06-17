import { create } from 'zustand'
import { electronService } from '../services/electronService'
import { v4 as uuidv4 } from 'uuid'
import { GUIDE_NOTE_ID, GUIDE_NOTE_VERSION, makeGuideNote } from '../utils/guideNote'

const FALLBACK_KEY = 'sn_notes'

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveLocal(notes) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(notes))
  } catch {}
}

export const useNotesStore = create((set, get) => ({
  notes: {},
  selectedNoteId: null,
  loading: false,
  pendingNoteAppend: null,

  init: async () => {
    set({ loading: true })
    try {
      let notesList = []
      if (electronService.isElectron) {
        notesList = await window.electronAPI.notes.getAll()
      } else {
        notesList = Object.values(loadLocal())
      }
      const notes = {}
      notesList.forEach(n => { notes[n.id] = n })

      // Seed the guide note on first launch or if it was somehow removed
      const isFirstLaunch = notesList.length === 0
      if (!notes[GUIDE_NOTE_ID]) {
        const guide = makeGuideNote()
        notes[GUIDE_NOTE_ID] = guide
        if (electronService.isElectron) {
          await window.electronAPI.notes.create(guide)
        } else {
          const local = loadLocal()
          local[GUIDE_NOTE_ID] = guide
          saveLocal(local)
        }
      } else if (notes[GUIDE_NOTE_ID].guideVersion !== GUIDE_NOTE_VERSION) {
        const { content } = makeGuideNote()
        const migrated = { ...notes[GUIDE_NOTE_ID], content, guideVersion: GUIDE_NOTE_VERSION }
        notes[GUIDE_NOTE_ID] = migrated
        if (electronService.isElectron) {
          await window.electronAPI.notes.update(GUIDE_NOTE_ID, { content, guideVersion: GUIDE_NOTE_VERSION })
        } else {
          const local = loadLocal()
          local[GUIDE_NOTE_ID] = migrated
          saveLocal(local)
        }
      }

      set({
        notes,
        loading: false,
        selectedNoteId: isFirstLaunch ? GUIDE_NOTE_ID : null,
      })
    } catch (err) {
      console.error('Failed to load notes:', err)
      set({ notes: loadLocal(), loading: false })
    }
  },

  createNote: async (overrides = {}) => {
    const now = new Date().toISOString()
    const draft = {
      id: uuidv4(),
      title: '',
      content: '',
      color: 'default',
      pinned: false,
      favorite: false,
      archived: false,
      trashed: false,
      workspaceId: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }

    let note = draft
    if (electronService.isElectron) {
      note = await window.electronAPI.notes.create(draft)
    } else {
      const notes = loadLocal()
      notes[draft.id] = draft
      saveLocal(notes)
    }

    set(s => ({ notes: { ...s.notes, [note.id]: note }, selectedNoteId: note.id }))
    return note
  },

  updateNote: async (id, updates) => {
    const existing = get().notes[id]
    if (!existing) return

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }

    set(s => ({ notes: { ...s.notes, [id]: updated } }))

    try {
      if (electronService.isElectron) {
        await window.electronAPI.notes.update(id, updates)
      } else {
        const notes = loadLocal()
        notes[id] = updated
        saveLocal(notes)
      }
    } catch (err) {
      console.error('Failed to persist note update:', err)
    }
  },

  deleteNote: async (id) => {
    if (id === GUIDE_NOTE_ID) return
    set(s => {
      const notes = { ...s.notes }
      delete notes[id]
      return {
        notes,
        selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
      }
    })

    try {
      if (electronService.isElectron) {
        await window.electronAPI.notes.delete(id)
      } else {
        const notes = loadLocal()
        delete notes[id]
        saveLocal(notes)
      }
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  },

  setSelectedNote: (id) => set({ selectedNoteId: id }),

  // Merges a note created outside this window (e.g. the global Quick Capture
  // popup) into the store — it's already persisted by the main process.
  addNoteFromExternal: (note) => {
    set(s => ({ notes: { ...s.notes, [note.id]: note } }))
  },

  // Re-syncs from disk without touching selectedNoteId or any open editor's
  // local state — used when the window regains focus, since Quick Capture
  // (and sticky notes) can write notes while this window had nothing to push to.
  refreshNotes: async () => {
    if (!electronService.isElectron) return
    try {
      const notesList = await window.electronAPI.notes.getAll()
      const notes = {}
      notesList.forEach(n => { notes[n.id] = n })
      set({ notes })
    } catch (err) {
      console.error('Failed to refresh notes:', err)
    }
  },

  // Appends HTML to a note's content and persists it. If that note's editor
  // is currently mounted, it also picks up `pendingNoteAppend` to insert the
  // content live (see NoteEditor) — both paths converge on the same final
  // content, so this stays correct whether or not the note is open.
  appendToNote: (id, html) => {
    const existing = get().notes[id]
    if (!existing) return
    const separator = existing.content?.trim() ? '<hr>' : ''
    get().updateNote(id, { content: (existing.content || '') + separator + html })
    set({ pendingNoteAppend: { noteId: id, html: separator + html, requestId: uuidv4() } })
  },

  clearPendingNoteAppend: () => set({ pendingNoteAppend: null }),

  archiveNote: (id, value) => get().updateNote(id, { archived: value, trashed: false }),
  trashNote: (id, value) => {
    if (id === GUIDE_NOTE_ID) return
    get().updateNote(id, { trashed: value, archived: false })
  },
  restoreNote: (id) => get().updateNote(id, { trashed: false, archived: false }),

  openAsFloating: (id) => {
    if (electronService.isElectron) {
      window.electronAPI.floating.open(id).catch(err => console.error('Failed to open sticky note:', err))
    }
  },

  getActiveNotes: (view, workspaceId, searchQuery) => {
    const all = Object.values(get().notes)
    let list = all

    if (view === 'trash') return list.filter(n => n.trashed)
    if (view === 'archived') return list.filter(n => n.archived && !n.trashed)
    if (view === 'favorites') list = list.filter(n => n.favorite && !n.trashed && !n.archived)
    else if (view === 'pinned') list = list.filter(n => n.pinned && !n.trashed && !n.archived)
    else list = list.filter(n => !n.trashed && !n.archived)

    if (workspaceId) list = list.filter(n => n.workspaceId === workspaceId)

    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.content?.replace(/<[^>]+>/g, ' ').toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  },
}))
