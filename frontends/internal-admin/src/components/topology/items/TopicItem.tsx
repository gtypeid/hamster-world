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

  render(): { nodes: Node[]; edges: Edge[] } {
    const isInactive = this.isInactive(undefined, this.topic)
    const topicId = this.getId()

    const node: Node = {
      id: topicId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="text-[9px] font-bold text-yellow-900 bg-yellow-200 px-2 py-0.5 rounded-t mb-1">
              TOPIC
            </div>
            <div className="text-lg mb-1">📨</div>
            <div className="text-xs font-bold text-yellow-900">{this.topic}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#f9fafb' : '#fef3c7',
        color: '#92400e',
        border: '2px solid #d97706',
        borderRadius: '8px',
        padding: '0',
        width: TOPIC_NODE_WIDTH,
        height: TOPIC_NODE_HEIGHT,
        opacity: isInactive ? 0.3 : 1,
      },
    }

    const edges: Edge[] = []

    // Publisher → Topic 엣지들
    this.publishers.forEach(({ publisherId }) => {
      edges.push({
        id: `edge-publisher-topic-${publisherId}-${this.topic}`,
        source: publisherId,
        target: topicId,
        label: 'publishes',
        animated: !isInactive,
        style: {
          stroke: isInactive ? '#d1d5db' : '#10b981',
          strokeWidth: 3,
          opacity: isInactive ? 0.3 : 1,
        },
        labelStyle: {
          fill: '#059669',
          fontSize: 10,
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: '#d1fae5',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isInactive ? '#d1d5db' : '#10b981',
        },
      })
    })

    // Topic → Consumer 엣지들
    this.consumers.forEach(({ consumerId }) => {
      edges.push({
        id: `edge-topic-consumer-${this.topic}-${consumerId}`,
        source: topicId,
        target: consumerId,
        label: 'consumed',
        animated: !isInactive,
        style: {
          stroke: isInactive ? '#d1d5db' : '#3b82f6',
          strokeWidth: 3,
          opacity: isInactive ? 0.3 : 1,
        },
        labelStyle: {
          fill: '#2563eb',
          fontSize: 10,
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: '#dbeafe',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isInactive ? '#d1d5db' : '#3b82f6',
        },
      })
    })

    return { nodes: [node], edges }
  }
}
