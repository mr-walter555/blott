import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3001'

// Stable anonymous identity per browser session
function getOrCreateUser() {
  let userId = localStorage.getItem('collab_userId')
  let displayName = localStorage.getItem('collab_displayName')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('collab_userId', userId)
  }
  return { userId, displayName: displayName || 'Guest' }
}

export function useCollaboration({ shareToken, onRemoteChange }) {
  const [collaborators, setCollaborators] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({})
  const socketRef = useRef(null)
  const isRemoteChange = useRef(false)
  const { userId, displayName } = getOrCreateUser()

  // Connect / join when shareToken is available
  useEffect(() => {
    if (!shareToken) return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { shareToken, userId, displayName })
    })

    // Another user's content change
    socket.on('change', ({ content, title, userId: fromId }) => {
      if (fromId === userId) return
      isRemoteChange.current = true
      onRemoteChange?.({ content, title })
      // Reset flag after React flushes
      setTimeout(() => { isRemoteChange.current = false }, 0)
    })

    // Full user list update
    socket.on('users', (users) => {
      setCollaborators(users.filter(u => u.userId !== userId))
    })

    socket.on('user:joined', (user) => {
      if (user.userId === userId) return
      setCollaborators(prev => {
        if (prev.find(u => u.userId === user.userId)) return prev
        return [...prev, user]
      })
    })

    socket.on('user:left', ({ userId: leftId }) => {
      setCollaborators(prev => prev.filter(u => u.userId !== leftId))
      setRemoteCursors(prev => {
        const next = { ...prev }
        delete next[leftId]
        return next
      })
    })

    // Remote cursor positions
    socket.on('cursor', ({ userId: fromId, from, to, displayName: name, color }) => {
      if (fromId === userId) return
      setRemoteCursors(prev => ({ ...prev, [fromId]: { from, to, displayName: name, color } }))
    })

    return () => {
      socket.emit('leave', { shareToken, userId })
      socket.disconnect()
      socketRef.current = null
      setCollaborators([])
      setRemoteCursors({})
    }
  }, [shareToken])

  // Emit a local content change (call from editor's onChange)
  const emitChange = useCallback((content, title) => {
    if (!socketRef.current || isRemoteChange.current || !shareToken) return
    socketRef.current.emit('change', { shareToken, content, title, userId })
  }, [shareToken, userId])

  // Emit cursor position
  const emitCursor = useCallback((from, to) => {
    if (!socketRef.current || !shareToken) return
    socketRef.current.emit('cursor', { shareToken, userId, from, to })
  }, [shareToken, userId])

  // Emit a new comment (so it broadcasts to all in the room)
  const emitComment = useCallback((comment) => {
    if (!socketRef.current || !shareToken) return
    socketRef.current.emit('comment:add', { shareToken, comment })
  }, [shareToken])

  return { collaborators, remoteCursors, emitChange, emitCursor, emitComment, userId, displayName }
}
