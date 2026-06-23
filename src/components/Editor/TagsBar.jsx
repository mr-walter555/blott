import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, X, Tag, Sparkle } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotesStore } from '../../store/notesStore'
import { askNotes } from '../../services/aiService'

export default function TagsBar({ note }) {
  const updateNote = useNotesStore(s => s.updateNote)
  const allNotes   = useNotesStore(s => s.notes)

  const [adding, setAdding]               = useState(false)
  const [inputValue, setInputValue]       = useState('')
  const [aiSuggestions, setAISuggestions] = useState([])
  const [suggesting, setSuggesting]       = useState(false)
  const [suggestError, setSuggestError]   = useState(false)
  const inputRef = useRef(null)

  const tags = note.tags || []

  // Fix 2: derive note text once so the sparkle button can read it for disabled state
  const noteText = useMemo(() =>
    (note.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    [note.content]
  )

  const allTags = useMemo(() => {
    const tagSet = new Set()
    Object.values(allNotes).forEach(n => {
      if (n.tags) n.tags.forEach(t => tagSet.add(t))
    })
    return [...tagSet].sort()
  }, [allNotes])

  // Fix 4: only show autocomplete when the user has typed something
  const autocompleteSuggestions = useMemo(() => {
    if (!inputValue.trim()) return []
    const pool = allTags.filter(t => !tags.includes(t))
    return pool.filter(t => t.toLowerCase().includes(inputValue.toLowerCase()))
  }, [inputValue, allTags, tags])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  function addTag(raw) {
    const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/,/g, '')
    if (!cleaned || tags.includes(cleaned)) { setInputValue(''); return }
    updateNote(note.id, { tags: [...tags, cleaned] })
    setInputValue('')
    inputRef.current?.focus()
  }

  function removeTag(tag) {
    updateNote(note.id, { tags: tags.filter(t => t !== tag) })
  }

  function acceptSuggestion(tag) {
    if (!tags.includes(tag)) {
      updateNote(note.id, { tags: [...tags, tag] })
    }
    setAISuggestions(prev => prev.filter(s => s !== tag))
  }

  async function handleSuggest() {
    if (!noteText || suggesting) return
    setSuggesting(true)
    setSuggestError(false)
    setAISuggestions([])
    try {
      const { answer } = await askNotes(
        'Suggest 5 short, lowercase, hyphenated tags for this note. Reply with ONLY a comma-separated list, nothing else.',
        [{ id: note.id, title: note.title || 'Untitled', excerpt: noteText.slice(0, 8000) }],
        []
      )
      const parsed = answer
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
        .filter(t => t.length > 0 && t.length < 30 && !tags.includes(t))
        .slice(0, 5)
      setAISuggestions(parsed)
    } catch {
      // Fix 1: surface failure to user instead of silently swallowing it
      setSuggestError(true)
      setTimeout(() => setSuggestError(false), 3000)
    } finally {
      setSuggesting(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    }
    if (e.key === 'Escape') { setAdding(false); setInputValue('') }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  if (note.trashed) return null

  const canSuggest = !!noteText && !suggesting

  return (
    <div className="mb-4">
      {/* Tags + controls row */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="group tag-chip flex items-center gap-1 px-2.5 py-[5px] rounded-full text-xs font-medium"
          >
            <span className="opacity-40 font-normal leading-none select-none">#</span>
            <span className="leading-none">{tag}</span>
            {/* Fix 3: larger hit area, full opacity on hover */}
            <button
              onClick={() => removeTag(tag)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {tags.length === 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-gray-300 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 transition-colors px-1"
          >
            <Tag className="w-3 h-3" />
            <span>Add tags</span>
          </button>
        )}

        {tags.length > 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            title="Add tag"
            className="flex items-center justify-center w-5 h-5 rounded-full text-gray-300 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-500 dark:hover:text-gray-500 transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}

        {adding && (
          <div className="relative">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue.trim()) addTag(inputValue)
                setTimeout(() => { setAdding(false); setInputValue('') }, 150)
              }}
              placeholder="Tag name…"
              className="text-xs px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-transparent outline-none text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-700 w-28"
            />
            {autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                {autocompleteSuggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    onMouseDown={() => addTag(s)}
                    className="w-full px-3 py-1.5 text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fix 2: disabled when note is empty, with explanatory title */}
        <button
          onClick={handleSuggest}
          disabled={!canSuggest}
          title={!noteText ? 'Add some content to get tag suggestions' : 'Suggest tags with AI'}
          className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 ${
            suggesting
              ? 'cursor-wait opacity-60'
              : !noteText
                ? 'cursor-not-allowed opacity-25'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
          }`}
        >
          <Sparkle
            className="w-4 h-4 transition-all duration-200 text-gray-900 dark:text-gray-100"
            weight={suggesting ? 'fill' : 'regular'}
            style={suggesting ? { animation: 'tag-suggest-pulse 1s ease-in-out infinite' } : {}}
          />
        </button>
      </div>

      {/* Fix 1: error state */}
      <AnimatePresence>
        {suggestError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2 text-[11px] text-red-400 dark:text-red-500"
          >
            Couldn't generate suggestions. Try again.
          </motion.p>
        )}
      </AnimatePresence>

      {/* AI suggestion pills */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkle className="w-2.5 h-2.5 text-brown-400 dark:text-brown-600 flex-shrink-0" weight="fill" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Suggested</span>
              <button
                onClick={() => setAISuggestions([])}
                title="Dismiss"
                className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {aiSuggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, scale: 0.85, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.18, delay: i * 0.045, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => acceptSuggestion(s)}
                    className="ai-tag-pill flex items-center gap-1.5 pl-2.5 pr-3 py-[5px] rounded-full text-xs font-medium"
                  >
                    <Sparkle className="w-2.5 h-2.5 flex-shrink-0" weight="fill" />
                    <span className="leading-none">{s}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
