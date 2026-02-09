import type { Node, Edge } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

const EVENT_NODE_WIDTH = 180
const EVENT_NODE_HEIGHT = 60

export type EventRenderMode = 'single' | 'multi'

/**
 * Event 노드 아이템
 * - Publisher 또는 Consumer의 자식으로 이벤트를 나타냄
 * - Publisher/Consumer → Event 엣지를 생성 (점선)
 * - 단일 모드: Publisher의 이벤트만 노드 생성, Consumer는 참조만
 * - 복수 모드: 모든 이벤트를 각자 노드로 생성
 */
export class EventItem extends TopologyWorldItem {
  constructor(
    private eventName: string,
    private parentId: string, // publisher-xxx 또는 consumer-xxx
    private topic: string,
    private ownerService: string, // 이벤트를 발행하는 서비스명
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `event-${this.parentId}-${this.eventName}`
  }

  /**
   * Publisher가 소유한 이벤트인지 확인
   */
  isOwnedByPublisher(): boolean {
    return this.parentId.startsWith('publisher-')
  }

  /**
   * 단일 모드에서 참조할 Publisher 이벤트 ID
   */
  getCanonicalEventId(): string {
    return `event-publisher-${this.ownerService}-${this.topic}-${this.eventName}`
  }

  render(mode: EventRenderMode = 'multi'): { nodes: Node[]; edges: Edge[] } {
    const isInactive = this.isInactive(undefined, this.topic)

    // 단일 모드: Publisher만 노드 생성, Consumer는 참조만
    if (mode === 'single') {
      if (this.isOwnedByPublisher()) {
        // Publisher 이벤트: 노드 + 엣지 생성
        return this.createNodeAndEdge(isInactive)
      } else {
        // Consumer: Publisher 이벤트를 참조하는 엣지만 생성
        const canonicalEventId = this.getCanonicalEventId()
        const edge: Edge = {
          id: `edge-consumer-ref-${this.parentId}-${this.eventName}`,
          source: this.parentId,
          target: canonicalEventId, // Publisher의 이벤트 노드 참조
          animated: false,
          style: {
            stroke: isInactive ? '#e5e7eb' : '#c084fc',
            strokeWidth: 1,
            strokeDasharray: '5,5',
            opacity: isInactive ? 0.3 : 0.6,
          },
        }
        return { nodes: [], edges: [edge] }
      }
    }

    // 복수 모드: 모든 이벤트를 각자 노드로 생성
    return this.createNodeAndEdge(isInactive)
  }

  private createNodeAndEdge(isInactive: boolean): { nodes: Node[]; edges: Edge[] } {
    const eventId = this.getId()

    const node: Node = {
      id: eventId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="text-[8px] font-bold text-purple-900 bg-purple-200 px-1 py-0.5 rounded-t mb-1">
              EVENT
            </div>
            <div className="text-[11px] font-bold text-purple-900">{this.eventName}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#faf5ff' : '#f3e8ff',
        color: '#581c87',
        border: '2px solid #9333ea',
        borderRadius: '6px',
        padding: '0',
        width: EVENT_NODE_WIDTH,
        height: EVENT_NODE_HEIGHT,
        opacity: isInactive ? 0.3 : 1,
      },
    }

    const edge: Edge = {
      id: `edge-parent-event-${this.parentId}-${this.eventName}`,
      source: this.parentId,
      target: eventId,
      animated: false,
      style: {
        stroke: isInactive ? '#e5e7eb' : '#c084fc',
        strokeWidth: 1,
        strokeDasharray: '5,5',
        opacity: isInactive ? 0.3 : 0.6,
      },
    }

    return { nodes: [node], edges: [edge] }
  }
}
