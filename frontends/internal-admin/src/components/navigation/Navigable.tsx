import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigation } from './NavigationContext'
import { ViewerRegistry } from './registry/ViewerRegistry'
import { ServiceRegistry } from './registry/ServiceRegistry'
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
  const location = useLocation()

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
 */
function inferViewerType(idType: IdType): ViewerType {
  switch (idType) {
    case 'process-id':
      return 'process-detail'
    case 'payment-id':
      return 'payment-detail'
    case 'event-id':
      return 'event-timeline'
    case 'trace-id':
      return 'trace-timeline'
    case 'product-id':
      return 'product-detail'
    case 'ecommerce-product-id':
      return 'ecommerce-product-detail'
    case 'order-id':
      return 'order-detail'
    case 'user-id':
      return 'user-detail'
    default:
      return 'process-detail' // fallback
  }
}

/**
 * 라벨 포맷팅
 */
function formatLabel(type: IdType, id: string): string {
  const typeLabels: Record<IdType, string> = {
    'process-id': 'Process',
    'payment-id': 'Payment',
    'event-id': 'Event',
    'trace-id': 'Trace',
    'product-id': 'Product',
    'order-id': 'Order',
    'user-id': 'User',
    'ecommerce-product-id': 'E-Product',
  }

  return `${typeLabels[type]}: ${id}`
}

/**
 * ID 타입별 색상 - ServiceRegistry 기반
 */
function getColorForIdType(type: IdType): string {
  // ID 타입을 서비스로 매핑
  let service: 'payment' | 'gateway' | 'ecommerce' | null = null

  switch (type) {
    case 'process-id':
    case 'payment-id':
    case 'event-id':
      service = 'gateway'
      break

    case 'product-id':
      service = 'payment'
      break

    case 'order-id':
    case 'ecommerce-product-id':
    case 'user-id':
      service = 'ecommerce'
      break

    case 'trace-id':
      return 'text-gray-600 hover:text-gray-700' // Trace는 특별 (회색)

    default:
      return 'text-blue-600 hover:text-blue-700'
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

  return 'text-blue-600 hover:text-blue-700'
}
