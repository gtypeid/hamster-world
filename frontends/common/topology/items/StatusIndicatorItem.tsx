import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

export type StatusType = 'success' | 'failed'

/**
 * Status Indicator 커서 아이템
 * - 트레이스의 최종 상태 표시 (성공/실패)
 * - 성공: 위에 ✅ 커서
 * - 실패: 실패한 서비스 위에 ❌ 커서
 */
export class StatusIndicatorItem extends TopologyWorldItem {
  constructor(
    private status: StatusType,
    private targetService: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return `status-indicator-${this.status}-${this.targetService}`
  }

  getTargetNodeId(): string {
    // 실패 상태: 실패한 서비스 노드를 가리킴
    // 성공 상태: 루트 서비스 또는 마지막 노드
    if (this.status === 'failed') {
      return `service-${this.targetService}`
    }
    // 성공 상태는 고정 위치 (우측 상단)
    return 'status-success-fixed'
  }

  render(): { nodes: Node[] } {
    const isSuccess = this.status === 'success'

    const node: Node = {
      id: this.getId(),
      type: 'default',
      data: {
        label: (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <div className="text-2xl mb-1">{isSuccess ? '✅' : '❌'}</div>
            <div className={`text-xs font-bold whitespace-nowrap ${
              isSuccess ? 'text-green-900' : 'text-red-900'
            }`}>
              {isSuccess ? 'SUCCESS' : 'FAILED'}
            </div>
          </div>
        ),
        // 마커 배치 시 대상 노드 찾기용
        targetNodeId: this.getTargetNodeId(),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isSuccess ? '#dcfce7' : '#fee2e2',
        color: isSuccess ? '#166534' : '#7f1d1d',
        border: isSuccess ? '4px dashed #16a34a' : '4px dashed #dc2626',
        borderRadius: '12px',
        padding: '0',
        width: 150,
        height: 100,
        opacity: 1,
        boxShadow: isSuccess
          ? '0 0 30px rgba(34, 197, 94, 0.7)'
          : '0 0 30px rgba(220, 38, 38, 0.7)',
        fontSize: '1.3em',
      },
    }

    return { nodes: [node] }
  }
}
