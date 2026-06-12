export default function EmptyState({ icon: Icon, message, action, className = '', iconClassName = 'w-7 h-7 text-gray-200 dark:text-gray-700' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {Icon && <Icon className={iconClassName} />}
      <p className="text-sm text-gray-400 dark:text-gray-600">{message}</p>
      {action}
    </div>
  )
}
