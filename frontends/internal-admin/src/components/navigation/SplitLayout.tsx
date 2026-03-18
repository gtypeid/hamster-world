import { useState, type ReactNode } from 'react'

interface SplitLayoutProps {
  mainPane: ReactNode
  tracerPane: ReactNode
  defaultWidth?: number // TracerPane 기본 너비 (%)
  minWidth?: number // TracerPane 최소 너비 (%)
  maxWidth?: number // TracerPane 최대 너비 (%)
}

/**
 * SplitLayout
 * - Navigation System의 레이아웃 프레임워크
 * - 왼쪽: MainPane (메인 컨텐츠)
 * - 오른쪽: TracerPane (트레이싱/상세보기)
 */
export function SplitLayout({
  mainPane,
  tracerPane,
  defaultWidth = 40,
  minWidth = 30,
  maxWidth = 70,
}: SplitLayoutProps) {
  const [tracerWidth, setTracerWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = () => {
    setIsResizing(true)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return

    const containerWidth = window.innerWidth
    const newWidth = ((containerWidth - e.clientX) / containerWidth) * 100

    // 최소/최대 너비 제한
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setTracerWidth(newWidth)
    }
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* MainPane (왼쪽) - 독립 스크롤 */}
      <div
        className="h-full overflow-y-auto overflow-x-hidden"
        style={{ width: `${100 - tracerWidth}%` }}
      >
        {mainPane}
      </div>

      {/* Resize Handle */}
      <div
        className={`w-1 bg-gray-300 hover:bg-hamster-orange cursor-col-resize transition-colors flex-shrink-0 ${
          isResizing ? 'bg-hamster-orange' : ''
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* TracerPane (오른쪽) - 독립 스크롤 */}
      <div
        className="h-full overflow-y-auto overflow-x-hidden bg-gray-50 border-l-2 border-gray-200"
        style={{ width: `${tracerWidth}%` }}
      >
        {tracerPane}
      </div>
    </div>
  )
}
