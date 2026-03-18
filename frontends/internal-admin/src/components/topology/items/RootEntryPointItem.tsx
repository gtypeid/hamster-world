import type { Node } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

/**
 * Root Entry Point 커서 아이템
 * - 트레이스가 시작된 최초 진입점을 가리킴
 * - 위쪽에 커서처럼 표시
 */
export class RootEntryPointItem extends TopologyWorldItem {
  constructor(
    private rootService: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getId(): string {
    return 'root-entry-point'
  }

  getTargetNodeId(): string {
    return `service-${this.rootService}`
  }

  render(): { nodes: Node[] } {
    const node: Node = {
      id: this.getId(),
      type: 'default',
      data: {
        label: (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <div className="text-2xl mb-1">📍</div>
            <div className="text-xs font-bold text-blue-900 whitespace-nowrap">START</div>
            <div className="text-[10px] text-blue-700 font-mono">{this.rootService}</div>
          </div>
        ),
        // 마커 배치 시 대상 노드 찾기용
        targetNodeId: this.getTargetNodeId(),
      },
      position: { x: 0, y: 0 },
      style: {
        background: '#dbeafe',
        color: '#1e3a8a',
        border: '4px dashed #0ea5e9',
        borderRadius: '12px',
        padding: '0',
        width: 160,
        height: 100,
        opacity: 1,
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.7)',
        fontSize: '1.2em',
      },
    }

    return { nodes: [node] }
  }
}
