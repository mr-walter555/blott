export default function CollaboratorAvatars({ collaborators }) {
  if (!collaborators.length) return null

  return (
    <div className="flex items-center gap-1" title={`${collaborators.length} collaborator${collaborators.length > 1 ? 's' : ''} online`}>
      <div className="flex -space-x-2">
        {collaborators.slice(0, 4).map(user => (
          <div
            key={user.userId}
            title={user.displayName}
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: user.color || '#6b7280' }}
          >
            {(user.displayName || 'G')[0].toUpperCase()}
          </div>
        ))}
      </div>
      {collaborators.length > 4 && (
        <span className="text-xs text-gray-400 ml-1">+{collaborators.length - 4}</span>
      )}
    </div>
  )
}
