import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

const CONSUMER_NODE_WIDTH = 200
const CONSUMER_NODE_HEIGHT = 90

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

  render(): { nodes: Node[] } {
    const isInactive = this.isInactive(undefined, this.topic)
    const consumerId = this.getId()

    const node: Node = {
      id: consumerId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className={`text-[8px] font-bold px-1 py-0.5 rounded-t mb-1 ${
              isInactive ? 'text-gray-400 bg-gray-100' : 'text-blue-900 bg-blue-200'
            }`}>
              CONSUMER
            </div>
            <div className={`text-[10px] font-bold mb-1 ${isInactive ? 'text-gray-400' : 'text-blue-900'}`}>{this.topic}</div>
            <div className={`text-[8px] px-1 py-0.5 rounded ${
              isInactive ? 'text-gray-400 bg-gray-100' : 'text-blue-700 bg-blue-100'
            }`}>
              📦 {this.serviceName}
            </div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#fafafa' : '#dbeafe',
        color: isInactive ? '#9ca3af' : '#1e3a8a',
        border: isInactive ? '1px solid #d1d5db' : '3px solid #2563eb',
        borderRadius: '6px',
        padding: '0',
        width: CONSUMER_NODE_WIDTH,
        height: CONSUMER_NODE_HEIGHT,
        opacity: isInactive ? 0.4 : 1,
        boxShadow: isInactive ? 'none' : '0 4px 15px -3px rgba(37, 99, 235, 0.3)',
      },
    }

    return { nodes: [node] }
  }
}
