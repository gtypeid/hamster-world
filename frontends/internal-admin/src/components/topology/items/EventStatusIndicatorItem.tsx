import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

/**
 * Event Status Indicator 마커 아이템
 * - 이벤트 노드의 성공/실패 상태를 표시
 * - 트레이스 내에서 어느 깊이까지 성공했고 어디서 실패했는지 시각화
 *
 * 예: OrderCreatedEvent(✅) → PaymentProcessedEvent(❌) → ...
 */
export class EventStatusIndicatorItem extends TopologyWorldItem {
  constructor(
    private eventId: string,
    _eventName: string,
    private status: 'success' | 'failed',
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `event-marker-${this.eventId}`
  }

  getTargetNodeId(): string {
    return this.eventId
  }

  render(): { nodes: Node[] } {
    const isSuccess = this.status === 'success'
    const emoji = isSuccess ? '✅' : '❌'

    const node: Node = {
      id: this.getId(),
      type: 'default',
      data: {
        label: (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <div className="text-lg">{emoji}</div>
          </div>
        ),
        // 마커 배치 시 대상 노드 찾기용
        targetNodeId: this.getTargetNodeId(),
        isEventMarker: true,
      },
      position: { x: 0, y: 0 },
      style: {
        background: isSuccess ? '#dcfce7' : '#fee2e2',
        color: isSuccess ? '#166534' : '#7f1d1d',
        border: isSuccess ? '2px solid #16a34a' : '2px solid #dc2626',
        borderRadius: '50%',
        padding: '0',
        width: 50,
        height: 50,
        opacity: 1,
        boxShadow: isSuccess
          ? '0 0 15px rgba(34, 197, 94, 0.6)'
          : '0 0 15px rgba(220, 38, 38, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }

    return { nodes: [node] }
  }
}
