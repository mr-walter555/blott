export default function EmptyState({ icon: Icon, message, action, className = '', iconClassName = 'w-7 h-7 text-gray-200 dark:text-gray-700', centered = false }) {
  return (
    <div className={`flex flex-col gap-2 ${centered ? 'items-center text-center w-full' : 'items-start px-4'} ${className}`}>
      {Icon && <Icon className={iconClassName} />}
      <p className="text-sm text-muted dark:text-gray-600">{message}</p>
      {action}
    </div>
  )
}
