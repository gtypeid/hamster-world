export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin text-5xl mb-3">🐹</div>
      <p className="text-sm text-gray-600">열심히 일하는 중...</p>
    </div>
  )
}
