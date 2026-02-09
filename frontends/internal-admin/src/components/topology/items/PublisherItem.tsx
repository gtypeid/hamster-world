import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

const PUBLISHER_NODE_WIDTH = 200
const PUBLISHER_NODE_HEIGHT = 70

/**
 * Publisher 노드 아이템
 * - 서비스가 특정 토픽에 발행하는 것을 나타냄
 * - Service → Publisher 엣지를 생성
 */
export class PublisherItem extends TopologyWorldItem {
  constructor(
    private serviceName: string,
    private topic: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `publisher-${this.serviceName}-${this.topic}`
  }

  render(): { nodes: Node[]; edges: Edge[] } {
    const isInactive = this.isInactive(undefined, this.topic)
    const publisherId = this.getId()

    const node: Node = {
      id: publisherId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="text-[8px] font-bold text-red-900 bg-red-200 px-1 py-0.5 rounded-t mb-1">
              PUBLISHER
            </div>
            <div className="text-[11px] font-bold text-red-900">{this.topic}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#fef2f2' : '#fee2e2',
        color: '#7f1d1d',
        border: '2px solid #dc2626',
        borderRadius: '6px',
        padding: '0',
        width: PUBLISHER_NODE_WIDTH,
        height: PUBLISHER_NODE_HEIGHT,
        opacity: isInactive ? 0.3 : 1,
      },
    }

    // Service → Publisher 엣지 (빨간색)
    const edge: Edge = {
      id: `edge-service-publisher-${this.serviceName}-${this.topic}`,
      source: `service-${this.serviceName}`,
      target: publisherId,
      animated: !isInactive,
      style: {
        stroke: isInactive ? '#d1d5db' : '#dc2626',
        strokeWidth: 2,
        opacity: isInactive ? 0.3 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isInactive ? '#d1d5db' : '#dc2626',
      },
    }

    return { nodes: [node], edges: [edge] }
  }
}
