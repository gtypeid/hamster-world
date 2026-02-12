import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

/**
 * Event Success Indicator 마커 아이템
 * - 트레이스 내 성공한 이벤트를 표시
 * - 작은 원형 마커 (✅ 초록색)
 */
export class EventSuccessIndicatorItem extends TopologyWorldItem {
  constructor(
    private eventId: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `event-success-marker-${this.eventId}`
  }

  getTargetNodeId(): string {
    return this.eventId
  }

  render(): { nodes: Node[] } {
    const node: Node = {
      id: this.getId(),
      type: 'default',
      data: {
        label: '✅',
        targetNodeId: this.getTargetNodeId(),
        isEventMarker: true,
      },
      position: { x: 0, y: 0 },
      style: {
        background: '#dcfce7',
        color: '#166534',
        border: '2px solid #16a34a',
        borderRadius: '50%',
        padding: '0',
        width: 40,
        height: 40,
        opacity: 1,
        boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9em',
      },
    }

    return { nodes: [node] }
  }
}
