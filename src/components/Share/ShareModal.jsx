import { useState, useEffect, useRef } from 'react'
import { X, Lock, Globe, Link, Check, CaretDown, ArrowSquareOut, Info } from '@phosphor-icons/react'
import { createShare, deleteShare, getShareInfo, sharePageUrl, syncShare, createInvite } from '../../services/shareService'
import { useNotesStore } from '../../store/notesStore'
import DropdownMenu from '../common/DropdownMenu'

const TABS = ['Share', 'Publish']

export default function ShareModal({ note, onClose }) {
  const updateNote              = useNotesStore(s => s.updateNote)
  const [tab, setTab]           = useState('Share')
  const [status, setStatus]     = useState('idle')   // idle | loading | shared | error
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied]     = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState('idle') // idle | sending | sent | error
  const accessAnchorRef = useRef(null)

  const isShared = status === 'shared'
  const url      = note.shareToken ? sharePageUrl(note.shareToken) : null

  // Verify share exists on open
  useEffect(() => {
    if (!note.shareToken) { setStatus('idle'); return }
    setStatus('loading')
    getShareInfo(note.shareToken).then(info => {
      setStatus(info ? 'shared' : 'idle')
    })
  }, [note.shareToken])

const enableShare = async () => {
    setStatus('loading')
    try {
      const { token } = await createShare({
        noteId:  note.id,
        title:   note.title || 'Untitled',
        content: note.content || '',
        token:   note.shareToken ?? undefined,
      })
      await updateNote(note.id, { shareToken: token })
      setStatus('shared')
    } catch (err) {
      setErrorMsg(err.message || 'Failed')
      setStatus('error')
    }
    setAccessOpen(false)
  }

  const disableShare = async () => {
    setStatus('loading')
    try {
      await deleteShare(note.shareToken)
      await updateNote(note.id, { shareToken: null })
      setStatus('idle')
    } catch {
      setStatus('shared')
    }
    setAccessOpen(false)
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !note.shareToken) return
    setInviteStatus('sending')
    try {
      await createInvite({ noteId: note.id, shareToken: note.shareToken, email: inviteEmail.trim(), noteTitle: note.title })
      setInviteEmail('')
      setInviteStatus('sent')
      setTimeout(() => setInviteStatus('idle'), 3000)
    } catch {
      setInviteStatus('idle')
    }
  }

  const copyLink = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-12 pr-6" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 w-96 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Share tab ── */}
        {tab === 'Share' && (
          <div>
            {/* Invite by email */}
            <div className="flex gap-2 p-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendInvite()}
                placeholder="Invite by email"
                disabled={!isShared || inviteStatus === 'sending'}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-500/20 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendInvite}
                disabled={!isShared || !inviteEmail.trim() || inviteStatus === 'sending'}
                className="px-4 py-2 text-sm font-medium bg-brown-600 hover:bg-brown-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inviteStatus === 'sending' ? '…' : inviteStatus === 'sent' ? 'Sent!' : 'Invite'}
              </button>
            </div>

            {/* Owner row */}
            <div className="flex items-center gap-3 px-4 pb-4">
              <div className="w-8 h-8 rounded-full bg-brown-100 dark:bg-brown-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <span className="text-sm font-semibold text-brown-600 dark:text-brown-400">
                  {(note.title || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  You <span className="font-normal text-gray-400">(Owner)</span>
                </p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Full access</span>
            </div>

            {/* General access */}
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">General access</p>
              <div>
                <button
                  ref={accessAnchorRef}
                  onClick={() => setAccessOpen(!accessOpen)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isShared ? 'bg-brown-100 dark:bg-brown-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {isShared
                      ? <Globe className="w-4 h-4 text-brown-500" />
                      : <Lock className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {status === 'loading' ? 'Loading…' : isShared ? 'Anyone with the link' : 'Only you'}
                    </p>
                    {isShared && (
                      <p className="text-xs text-gray-400 mt-0.5">Can view and comment</p>
                    )}
                  </div>
                  <CaretDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${accessOpen ? 'rotate-180' : ''}`} />
                </button>

                <DropdownMenu
                  anchor={accessAnchorRef}
                  open={accessOpen}
                  onClose={() => setAccessOpen(false)}
                  matchWidth
                >
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                    <button
                      onClick={disableShare}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">Only you</p>
                        <p className="text-xs text-gray-400">Private — link deactivated</p>
                      </div>
                      {!isShared && <Check className="w-4 h-4 text-brown-500 flex-shrink-0" />}
                    </button>
                    <button
                      onClick={enableShare}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-brown-100 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-brown-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">Anyone with the link</p>
                        <p className="text-xs text-gray-400">Can view and comment</p>
                      </div>
                      {isShared && <Check className="w-4 h-4 text-brown-500 flex-shrink-0" />}
                    </button>
                  </div>
                </DropdownMenu>
              </div>

              {status === 'error' && (
                <p className="mt-2 text-xs text-red-500 font-mono">{errorMsg}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Info className="w-4 h-4" />
                Learn about sharing
              </button>
              <button
                onClick={copyLink}
                disabled={!isShared}
                className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        {/* ── Publish tab ── */}
        {tab === 'Publish' && (
          <div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Public link</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Anyone on the internet can view this note. Enable sharing first from the Share tab.
                </p>
                {isShared && url ? (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{url}</span>
                    <button
                      onClick={() => window.open(url, '_blank')}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="Open in browser"
                    >
                      <ArrowSquareOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 italic">Enable sharing to get a public link</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                For internet access, expose port 3001 via a tunnel (e.g. ngrok, Cloudflare Tunnel) and replace <span className="font-mono">localhost:3001</span> with your public URL.
              </p>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Info className="w-4 h-4" />
                Learn about publishing
              </button>
              <button
                onClick={copyLink}
                disabled={!isShared}
                className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
