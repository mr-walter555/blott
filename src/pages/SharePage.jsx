import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function SharePage({ token }) {
  const [note, setNote]     = useState(null)
  const [status, setStatus] = useState('loading') // loading | found | notfound

  useEffect(() => {
    fetch(`${API_URL}/api/share/${token}/content`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setNote(data); setStatus('found') })
      .catch(() => setStatus('notfound'))
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">Note not found</p>
          <p className="text-gray-400 text-sm">This link may have been deactivated.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-brown-600 px-6 py-3 flex items-center gap-3">
        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 fill-white" viewBox="0 0 16 16">
            <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3v1h8V5H4zm0 3v1h8V8H4zm0 3v1h5v-1H4z"/>
          </svg>
        </div>
        <span className="text-white font-semibold text-sm">Smart Notepad</span>
        <span className="ml-auto bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
          Shared
        </span>
      </div>

      {/* Note content */}
      <div className="max-w-3xl mx-auto px-6 py-10 pb-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{note.title || 'Untitled'}</h1>
        <p className="text-xs text-gray-400 mb-8">
          Shared note · Last updated {new Date(note.updatedAt).toLocaleDateString()}
        </p>
        <div
          className="prose prose-gray max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>
    </div>
  )
}
