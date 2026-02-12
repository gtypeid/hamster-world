import type { Node } from 'reactflow'
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

  render(): { nodes: Node[] } {
    const isInactive = this.isInactive(undefined, this.topic)
    const publisherId = this.getId()

    const node: Node = {
      id: publisherId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className={`text-[8px] font-bold px-1 py-0.5 rounded-t mb-1 ${
              isInactive ? 'text-gray-400 bg-gray-100' : 'text-red-900 bg-red-200'
            }`}>
              PUBLISHER
            </div>
            <div className={`text-[11px] font-bold ${isInactive ? 'text-gray-400' : 'text-red-900'}`}>{this.topic}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#fafafa' : '#fee2e2',
        color: isInactive ? '#9ca3af' : '#7f1d1d',
        border: isInactive ? '1px solid #d1d5db' : '3px solid #dc2626',
        borderRadius: '6px',
        padding: '0',
        width: PUBLISHER_NODE_WIDTH,
        height: PUBLISHER_NODE_HEIGHT,
        opacity: isInactive ? 0.4 : 1,
        boxShadow: isInactive ? 'none' : '0 4px 15px -3px rgba(220, 38, 38, 0.3)',
      },
    }

    return { nodes: [node] }
  }
}
