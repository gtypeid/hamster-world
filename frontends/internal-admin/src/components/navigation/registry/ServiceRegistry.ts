/**
 * Service Registry
 * - 서비스별 공통 설정 중앙 관리
 */

export type ServiceType = 'payment' | 'gateway' | 'ecommerce'

export interface ServiceConfig {
  name: string // 표시 이름
  icon: string // 서비스 아이콘
  color: string // 배지 색상 (Tailwind class)
  listRoute: string // 기본 리스트 페이지 라우트
}

class ServiceRegistryClass {
  private services: Record<ServiceType, ServiceConfig> = {
    payment: {
      name: 'PAYMENT',
      icon: '💳',
      color: 'bg-purple-500',
      listRoute: '/payment/resource',
    },
    gateway: {
      name: 'GATEWAY',
      icon: '🚪',
      color: 'bg-blue-500',
      listRoute: '/gateway/processes',
    },
    ecommerce: {
      name: 'ECOMMERCE',
      icon: '🛒',
      color: 'bg-green-500',
      listRoute: '/ecommerce/orders',
    },
  }

  get(service: ServiceType): ServiceConfig {
    return this.services[service]
  }

  getAll(): Record<ServiceType, ServiceConfig> {
    return this.services
  }
}

export const ServiceRegistry = new ServiceRegistryClass()
