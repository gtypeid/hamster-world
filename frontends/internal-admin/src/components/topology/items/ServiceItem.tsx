import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'
import { ServiceRegistry } from '@/components/navigation/registry/ServiceRegistry'

const SERVICE_NODE_WIDTH = 250
const SERVICE_NODE_HEIGHT = 120

/**
 * 서비스 노드 아이템
 */
export class ServiceItem extends TopologyWorldItem {
  constructor(
    private serviceName: string,
    private icon?: string,
    private color?: string,
    traceContext?: any
  ) {
    super(traceContext)
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
    // ServiceRegistry에서 아이콘과 색상 가져오기
    const serviceType = ServiceItem.getServiceType(serviceName)
    const config = serviceType ? ServiceRegistry.get(serviceType) : null

    return new ServiceItem(
      serviceName,
      config?.icon,
      config?.color,
      traceContext
    )
  }

  private static getServiceType(serviceName: string): 'payment' | 'gateway' | 'ecommerce' | 'notification' | null {
    if (serviceName.includes('payment')) return 'payment'
    if (serviceName.includes('gateway')) return 'gateway'
    if (serviceName.includes('ecommerce')) return 'ecommerce'
    if (serviceName.includes('notification')) return 'notification'
    if (serviceName.includes('progression')) return 'notification'
    return null
  }
}
