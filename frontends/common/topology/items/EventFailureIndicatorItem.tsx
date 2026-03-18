import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

/**
 * Event Failure Indicator 마커 아이템
 * - 트레이스 내 실패한 이벤트를 표시
 * - 큰 원형 마커 (❌ 빨간색) - 명확하게 보임
 */
export class EventFailureIndicatorItem extends TopologyWorldItem {
  constructor(
    private eventId: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `event-failure-marker-${this.eventId}`
  }

  getTargetNodeId(): string {
    return this.eventId
  }

  render(): { nodes: Node[] } {
    const node: Node = {
      id: this.getId(),
      type: 'default',
      data: {
        label: '❌',
        targetNodeId: this.getTargetNodeId(),
        isEventMarker: true,
      },
      position: { x: 0, y: 0 },
      style: {
        background: '#fee2e2',
        color: '#7f1d1d',
        border: '3px solid #dc2626',
        borderRadius: '50%',
        padding: '0',
        width: 80,
        height: 80,
        opacity: 1,
        boxShadow: '0 0 25px rgba(220, 38, 38, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.8em',
      },
    }

    return { nodes: [node] }
  }
}
