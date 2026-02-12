import { type ReactNode } from 'react'
import { useNavigation } from './NavigationContext'
import { ServiceRegistry } from './registry/ServiceRegistry'
import { FieldRegistry } from './registry/FieldRegistry'
import type { IdType, ViewerType } from '@/types/navigation'

interface NavigableProps {
  id: string // ID 값
  type: IdType // ID 타입
  viewerType?: ViewerType // 뷰어 타입 (지정 안 하면 자동 추론)
  label?: string // 표시할 라벨 (기본값: id)
  className?: string // 추가 CSS 클래스
  children?: ReactNode // 커스텀 렌더링
  data?: any // 뷰어에 전달할 추가 데이터
}

/**
 * Navigable Component
 * - 클릭 가능한 ID를 감싸는 컴포넌트
 * - 클릭 시 자동으로 TracerPane에 상세 뷰 표시
 */
export function Navigable({
  id,
  type,
  viewerType,
  label,
  className = '',
  children,
  data,
}: NavigableProps) {
  const { navigate } = useNavigation()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // ViewerType 자동 추론 (지정되지 않은 경우)
    const inferredViewerType = viewerType || inferViewerType(type)

    navigate({
      id,
      type,
      viewerType: inferredViewerType,
      label: label || formatLabel(type, id),
      data,
    })
  }

  // 기본 스타일
  const baseStyle =
    'cursor-pointer hover:underline transition-colors font-mono font-medium'

  // ID 타입별 색상
  const colorStyle = getColorForIdType(type)

  return (
    <span
      onClick={handleClick}
      className={`${baseStyle} ${colorStyle} ${className}`}
      title={`${type}: ${id}`}
    >
      {children || id}
    </span>
  )
}

/**
 * ID 타입으로 ViewerType 추론
 * - FieldRegistry 기반으로 자동 추론
 */
function inferViewerType(idType: IdType): ViewerType {
  const viewerType = FieldRegistry.inferViewerType(idType)
  if (viewerType) return viewerType

  // Fallback for special types not in FieldRegistry (event-timeline, trace-timeline)
  switch (idType) {
    case 'event-id':
      return 'event-timeline'
    case 'trace-id':
      return 'trace-timeline'
    default:
      console.warn(`[Navigable] Unknown idType: ${idType}, falling back to process-detail`)
      return 'process-detail'
  }
}

/**
 * 라벨 포맷팅
 * - FieldRegistry 기반으로 일관된 라벨 사용
 */
function formatLabel(type: IdType, id: string): string {
  const label = FieldRegistry.getLabelForIdType(type)

  // FieldRegistry에 없으면 fallback
  if (label === type) {
    // Special cases for event-id, trace-id
    const fallbackLabels: Partial<Record<IdType, string>> = {
      'event-id': 'Event',
      'trace-id': 'Trace',
    }
    const fallbackLabel = fallbackLabels[type] || type
    return `${fallbackLabel}: ${id}`
  }

  return `${label.replace(' ID', '')}: ${id}`
}

/**
 * ID 타입별 색상 - FieldRegistry + ServiceRegistry 기반
 */
function getColorForIdType(type: IdType): string {
  // FieldRegistry에서 서비스 정보 가져오기
  const service = FieldRegistry.getServiceForIdType(type)

  // Special case: trace-id는 회색
  if (type === 'trace-id') {
    return 'text-gray-600 hover:text-gray-700'
  }

  // ServiceRegistry에서 색상 가져오기
  if (service) {
    const serviceConfig = ServiceRegistry.get(service)
    // Tailwind color를 text color로 변환
    const colorMap: Record<string, string> = {
      'bg-purple-500': 'text-purple-600 hover:text-purple-700',
      'bg-blue-500': 'text-blue-600 hover:text-blue-700',
      'bg-green-500': 'text-green-600 hover:text-green-700',
    }
    return colorMap[serviceConfig.color] || 'text-blue-600 hover:text-blue-700'
  }

  // Fallback for event-id and unknown types
  return 'text-blue-600 hover:text-blue-700'
}
