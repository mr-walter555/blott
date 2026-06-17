import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useNotesStore } from '../store/notesStore'

const TEXT_FILE_RE = /\.(txt|md|markdown)$/i

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function textToHtml(text) {
  return text
    .split(/\r?\n/)
    .map(line => `<p>${escapeHtml(line) || '<br>'}</p>`)
    .join('')
}

// Lets a .txt/.md file be dropped onto any window to import it as a new note.
// Also prevents Electron's default "navigate to the dropped file" behavior,
// which would otherwise replace the app with the file's raw contents.
export function useFileDropImport() {
  const createNote = useNotesStore(s => s.createNote)

  useEffect(() => {
    const handleDragOver = (e) => e.preventDefault()

    const handleDrop = async (e) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length === 0) return

      const textFiles = files.filter(f => TEXT_FILE_RE.test(f.name))
      if (textFiles.length === 0) {
        toast.error('Only .txt and .md files can be imported')
        return
      }

      for (const file of textFiles) {
        const text = await file.text()
        const title = file.name.replace(/\.[^.]+$/, '')
        await createNote({ title, content: textToHtml(text) })
      }

      toast.success(textFiles.length === 1
        ? `Imported "${textFiles[0].name}"`
        : `Imported ${textFiles.length} notes`)
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [createNote])
}
