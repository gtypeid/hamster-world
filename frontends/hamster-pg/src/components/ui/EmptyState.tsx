interface EmptyStateProps {
  message?: string
  submessage?: string
}

export function EmptyState({
  message = '아직 데이터가 없어요',
  submessage = '햄스터가 배고파요 🌰'
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-6xl mb-4">🐹</div>
      <p className="text-gray-600 mb-1">{message}</p>
      <p className="text-sm text-gray-400">{submessage}</p>
    </div>
  )
}
