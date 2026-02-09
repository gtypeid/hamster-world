import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

const CONSUMER_NODE_WIDTH = 200
const CONSUMER_NODE_HEIGHT = 70

/**
 * Consumer 노드 아이템
 * - 서비스가 특정 토픽을 구독하는 것을 나타냄
 * - Consumer → Service 엣지를 생성
 */
export class ConsumerItem extends TopologyWorldItem {
  constructor(
    private serviceName: string,
    private topic: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `consumer-${this.serviceName}-${this.topic}`
  }

  render(): { nodes: Node[]; edges: Edge[] } {
    const isInactive = this.isInactive(undefined, this.topic)
    const consumerId = this.getId()

    const node: Node = {
      id: consumerId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="text-[8px] font-bold text-blue-900 bg-blue-200 px-1 py-0.5 rounded-t mb-1">
              CONSUMER
            </div>
            <div className="text-[11px] font-bold text-blue-900">{this.topic}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#eff6ff' : '#dbeafe',
        color: '#1e3a8a',
        border: '2px solid #2563eb',
        borderRadius: '6px',
        padding: '0',
        width: CONSUMER_NODE_WIDTH,
        height: CONSUMER_NODE_HEIGHT,
        opacity: isInactive ? 0.3 : 1,
      },
    }

    // Consumer → Service 엣지 (파란색)
    const edge: Edge = {
      id: `edge-consumer-service-${consumerId}-${this.serviceName}`,
      source: consumerId,
      target: `service-${this.serviceName}`,
      animated: !isInactive,
      style: {
        stroke: isInactive ? '#d1d5db' : '#2563eb',
        strokeWidth: 2,
        opacity: isInactive ? 0.3 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isInactive ? '#d1d5db' : '#2563eb',
      },
    }

    return { nodes: [node], edges: [edge] }
  }
}
