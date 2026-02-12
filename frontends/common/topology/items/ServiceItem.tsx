import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

const SERVICE_NODE_WIDTH = 250
const SERVICE_NODE_HEIGHT = 120

/**
 * 서비스별 아이콘/색상 기본값
 * - ServiceRegistry 의존성 제거: 기본값을 내장
 * - 외부에서 serviceConfigResolver를 주입하여 오버라이드 가능
 */
const DEFAULT_SERVICE_ICONS: Record<string, { icon: string; color: string }> = {
  payment: { icon: '💳', color: 'bg-purple-500' },
  gateway: { icon: '🚪', color: 'bg-blue-500' },
  ecommerce: { icon: '🛒', color: 'bg-green-500' },
  notification: { icon: '🔔', color: 'bg-orange-500' },
  progression: { icon: '🔔', color: 'bg-orange-500' },
}

export interface ServiceConfigResolver {
  getIconAndColor(serviceName: string): { icon: string; color: string } | null
}

/**
 * 서비스 노드 아이템
 */
export class ServiceItem extends TopologyWorldItem {
  private static configResolver?: ServiceConfigResolver

  constructor(
    private serviceName: string,
    private icon?: string,
    private color?: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  /**
   * 외부에서 서비스 설정 리졸버를 주입
   * internal-admin에서는 ServiceRegistry를 어댑터로 연결 가능
   */
  static setConfigResolver(resolver: ServiceConfigResolver): void {
    ServiceItem.configResolver = resolver
  }

  render(): { nodes: Node[] } {
    const isInactive = this.isInactive(this.serviceName)
    const bgColor = isInactive ? '#f9fafb' : (this.color ? this.getColor(this.color) : '#3b82f6')

    const node: Node = {
      id: `service-${this.serviceName}`,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded-t mb-2 ${
              isInactive ? 'text-gray-400 bg-gray-100' : 'text-white bg-black bg-opacity-30'
            }`}>
              SERVICE
            </div>
            <div className={`text-2xl mb-2 ${isInactive ? 'opacity-30' : ''}`}>{this.icon || '📦'}</div>
            <div className={`text-sm font-bold ${isInactive ? 'text-gray-400' : 'text-white'}`}>{this.serviceName}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: bgColor,
        color: isInactive ? '#9ca3af' : 'white',
        border: isInactive ? '1px solid #d1d5db' : '4px solid #1f2937',
        borderRadius: '12px',
        padding: '0',
        width: SERVICE_NODE_WIDTH,
        height: SERVICE_NODE_HEIGHT,
        opacity: isInactive ? 0.4 : 1,
        boxShadow: isInactive ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
      },
    }

    return { nodes: [node] }
  }

  static fromTopologyData(
    serviceName: string,
    traceContext?: any
  ): ServiceItem {
    // 외부 리졸버가 있으면 우선 사용
    if (ServiceItem.configResolver) {
      const config = ServiceItem.configResolver.getIconAndColor(serviceName)
      if (config) {
        return new ServiceItem(serviceName, config.icon, config.color, traceContext)
      }
    }

    // 기본값: 서비스명에서 타입 추출
    const serviceType = ServiceItem.getServiceType(serviceName)
    const defaults = serviceType ? DEFAULT_SERVICE_ICONS[serviceType] : null

    return new ServiceItem(
      serviceName,
      defaults?.icon,
      defaults?.color,
      traceContext
    )
  }

  private static getServiceType(serviceName: string): string | null {
    if (serviceName.includes('payment')) return 'payment'
    if (serviceName.includes('gateway')) return 'gateway'
    if (serviceName.includes('ecommerce')) return 'ecommerce'
    if (serviceName.includes('notification')) return 'notification'
    if (serviceName.includes('progression')) return 'progression'
    return null
  }
}
