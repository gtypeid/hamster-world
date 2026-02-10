import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

const TOPIC_NODE_WIDTH = 200
const TOPIC_NODE_HEIGHT = 80

/**
 * Topic 노드 아이템
 * - Kafka 토픽을 나타냄
 * - Publisher → Topic, Topic → Consumer 엣지를 생성
 */
export class TopicItem extends TopologyWorldItem {
  constructor(
    private topic: string,
    private publishers: { serviceName: string; publisherId: string }[],
    private consumers: { serviceName: string; consumerId: string }[],
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `topic-${this.topic}`
  }

  render(): { nodes: Node[] } {
    const isInactive = this.isInactive(undefined, this.topic)
    const topicId = this.getId()

    const node: Node = {
      id: topicId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded-t mb-1 ${
              isInactive ? 'text-gray-400 bg-gray-100' : 'text-yellow-900 bg-yellow-200'
            }`}>
              TOPIC
            </div>
            <div className={`text-lg mb-1 ${isInactive ? 'opacity-30' : ''}`}>📨</div>
            <div className={`text-xs font-bold ${isInactive ? 'text-gray-400' : 'text-yellow-900'}`}>{this.topic}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#fafafa' : '#fef3c7',
        color: isInactive ? '#9ca3af' : '#92400e',
        border: isInactive ? '1px solid #d1d5db' : '3px solid #d97706',
        borderRadius: '8px',
        padding: '0',
        width: TOPIC_NODE_WIDTH,
        height: TOPIC_NODE_HEIGHT,
        opacity: isInactive ? 0.4 : 1,
        boxShadow: isInactive ? 'none' : '0 4px 15px -3px rgba(217, 119, 6, 0.3)',
      },
    }

    return { nodes: [node] }
  }
}
