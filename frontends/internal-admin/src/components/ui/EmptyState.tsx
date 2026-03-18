interface EmptyStateProps {
  message: string
  submessage?: string
}

export function EmptyState({ message, submessage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-6xl mb-4">📭</span>
      <p className="text-lg font-medium text-gray-700 mb-1">{message}</p>
      {submessage && (
        <p className="text-sm text-gray-500">{submessage}</p>
      )}
    </div>
  )
}
