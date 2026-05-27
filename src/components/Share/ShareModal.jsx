import { useState, useEffect, useRef } from 'react'
import { Lock, Globe, Link, Check, CaretDown, ArrowSquareOut, Info } from '@phosphor-icons/react'
import { createShare, deleteShare, getShareInfo, sharePageUrl, createInvite, listInvites } from '../../services/shareService'
import { useNotesStore } from '../../store/notesStore'
import { gravatarUrl } from '../../utils/gravatar'
import DropdownMenu from '../common/DropdownMenu'

const TABS = ['Share', 'Publish']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Avatar({ email }) {
  const [imgError, setImgError] = useState(false)
  const initial = (email || '?')[0].toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
      {email && !imgError
        ? <img src={gravatarUrl(email)} alt={email} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        : <span className="text-sm font-semibold text-gray-500">{initial}</span>
      }
    </div>
  )
}

export default function ShareModal({ note, onClose }) {
  const updateNote              = useNotesStore(s => s.updateNote)
  const [tab, setTab]           = useState('Share')
  const [status, setStatus]     = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied]     = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState('idle')
  const [invitees, setInvitees] = useState([])
  const [liveViewers, setLiveViewers] = useState([])
  const accessAnchorRef = useRef(null)
  const pollRef = useRef(null)

  const ownerName  = localStorage.getItem('sn_user_name') || 'You'
  const ownerEmail = localStorage.getItem('sn_user_email') || ''

  const isShared = status === 'shared'
  const url      = note.shareToken ? sharePageUrl(note.shareToken) : null

  useEffect(() => {
    if (!note.shareToken) { setStatus('idle'); return }
    setStatus('loading')
    getShareInfo(note.shareToken).then(info => setStatus(info ? 'shared' : 'idle'))
  }, [note.shareToken])

  useEffect(() => {
    if (!note.shareToken) return
    listInvites(note.shareToken).then(setInvitees).catch(() => {})
  }, [note.shareToken])

  // Poll live viewers every 8s
  useEffect(() => {
    if (!note.shareToken || !isShared) return
    const poll = () => {
      fetch(`${API_URL}/api/share/${note.shareToken}/viewers`)
        .then(r => r.ok ? r.json() : [])
        .then(setLiveViewers)
        .catch(() => {})
    }
    poll()
    pollRef.current = setInterval(poll, 8000)
    return () => clearInterval(pollRef.current)
  }, [note.shareToken, isShared])

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
      setInvitees([])
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
      // Directly refresh the list — avoids race condition from effect re-running on status changes
      const updated = await listInvites(note.shareToken)
      setInvitees(updated)
      setTimeout(() => setInviteStatus('idle'), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send invite')
      setInviteStatus('idle')
      setTimeout(() => setErrorMsg(''), 4000)
    }
  }

  const copyLink = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasLiveViewers = liveViewers.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-12 pr-6" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-md border border-gray-200 w-96 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >{t}</button>
          ))}
        </div>

        {/* Share tab */}
        {tab === 'Share' && (
          <div>
            {/* Invite input */}
            <div className="p-4 pb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendInvite()}
                  placeholder="Email or group, separated by commas"
                  disabled={!isShared || inviteStatus === 'sending'}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendInvite}
                  disabled={!isShared || !inviteEmail.trim() || inviteStatus === 'sending'}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {inviteStatus === 'sending' ? '…' : inviteStatus === 'sent' ? 'Sent!' : 'Share'}
                </button>
              </div>
              {errorMsg && <p className="mt-1.5 text-xs text-red-500">{errorMsg}</p>}
              {!isShared && <p className="mt-1.5 text-xs text-gray-400">Enable sharing below to invite people.</p>}
            </div>

            {/* People with access */}
            <div className="px-4 pb-3">
              <p className="text-xs font-medium text-gray-500 mb-2">People with access</p>

              {/* Owner row */}
              <div className="flex items-center gap-3 py-1.5">
                <Avatar email={ownerEmail} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ownerName} <span className="font-normal text-gray-400">(You)</span>
                  </p>
                  {ownerEmail && (
                    <p className="text-xs text-gray-400 truncate">{ownerEmail}</p>
                  )}
                </div>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 flex-shrink-0">
                  Full access <CaretDown className="w-3 h-3" />
                </button>
              </div>

              {/* Invited users */}
              {invitees.map(inv => {
                const username = inv.email.split('@')[0]
                return (
                  <div key={inv.email} className="flex items-center gap-3 py-1.5">
                    <Avatar email={inv.email} />
                    <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                      <p className="text-sm text-gray-800 truncate">{username}</p>
                      {hasLiveViewers
                        ? <span className="text-xs text-green-500 font-medium flex-shrink-0">Viewing now</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">Invited</span>
                      }
                    </div>
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 flex-shrink-0">
                      Full access <CaretDown className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}

              {invitees.length === 0 && isShared && (
                <p className="text-xs text-gray-400 italic py-1">No invites sent yet</p>
              )}
            </div>

            {/* General access */}
            <div className="px-4 pb-3 pt-1 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2 mt-2">General access</p>
              <div>
                <button
                  ref={accessAnchorRef}
                  onClick={() => setAccessOpen(!accessOpen)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isShared ? 'bg-brown-100' : 'bg-gray-100'}`}>
                    {isShared ? <Globe className="w-4 h-4 text-brown-500" /> : <Lock className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {status === 'loading' ? 'Loading…' : isShared ? 'Anyone with the link' : 'Only you'}
                    </p>
                    {isShared && <p className="text-xs text-gray-400 mt-0.5">Can view and comment</p>}
                  </div>
                  <CaretDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${accessOpen ? 'rotate-180' : ''}`} />
                </button>

                <DropdownMenu anchor={accessAnchorRef} open={accessOpen} onClose={() => setAccessOpen(false)} matchWidth>
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                    <button onClick={disableShare} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">Only you</p>
                        <p className="text-xs text-gray-400">Private — link deactivated</p>
                      </div>
                      {!isShared && <Check className="w-4 h-4 text-brown-500 flex-shrink-0" />}
                    </button>
                    <button onClick={enableShare} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
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
              {status === 'error' && <p className="mt-2 text-xs text-red-500 font-mono">{errorMsg}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <Info className="w-4 h-4" />
                Learn about sharing
              </button>
              <button onClick={copyLink} disabled={!isShared}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        {/* Publish tab */}
        {tab === 'Publish' && (
          <div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Public link</p>
                <p className="text-xs text-gray-400 mb-3">
                  Anyone on the internet can view this note. Enable sharing first from the Share tab.
                </p>
                {isShared && url ? (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-xs text-gray-500 font-mono truncate">{url}</span>
                    <button onClick={() => window.open(url, '_blank')}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors" title="Open in browser">
                      <ArrowSquareOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 italic">Enable sharing to get a public link</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <Info className="w-4 h-4" />
                Learn about publishing
              </button>
              <button onClick={copyLink} disabled={!isShared}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
