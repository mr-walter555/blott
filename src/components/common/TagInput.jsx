import { useState, useRef } from 'react'
import { X } from '@phosphor-icons/react'

export default function TagInput({ tags = [], onChange, placeholder = 'Add tag…' }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  const addTag = (value) => {
    const tag = value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!tag || tags.includes(tag)) {
      setInputValue('')
      return
    }
    onChange([...tags, tag])
    setInputValue('')
  }

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className="flex items-center flex-wrap gap-1 min-h-7 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 text-xs px-2 py-0.5 bg-brown-50 dark:bg-brown-950/50 text-brown-600 dark:text-brown-400 rounded-full group"
        >
          #{tag}
          <button
            onClick={e => { e.stopPropagation(); removeTag(tag) }}
            className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-brown-100 dark:hover:bg-brown-900/50 transition-colors"
          >
            <X className="w-2 h-2" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue.trim() && addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-20 text-xs bg-transparent outline-none text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-700"
      />
    </div>
  )
}