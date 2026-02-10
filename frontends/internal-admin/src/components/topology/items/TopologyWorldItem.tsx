import type { Node, Edge } from 'reactflow'
import type { TraceContext } from '@/types/topology'

/**
 * 토폴로지 월드 내의 렌더링 가능한 아이템 베이스 클래스
 */
export abstract class TopologyWorldItem {
  protected traceContext?: TraceContext

  constructor(traceContext?: TraceContext) {
    this.traceContext = traceContext
  }

  /**
   * 이 아이템의 노드와 엣지를 렌더링
   * - EventItem/EdgeRelationItem: edges 반환
   * - 나머지: edges는 optional (또는 빈 배열)
   * @param mode - 이벤트 렌더링 모드 (single | multi), EventItem만 사용
   */
  abstract render(mode?: any): { nodes: Node[]; edges?: Edge[] }

  /**
   * TraceContext에 따라 비활성화 여부 판단
   */
  protected isInactive(serviceName?: string, topic?: string): boolean {
    if (!this.traceContext) return false

    if (serviceName && !this.traceContext.involvedServices.has(serviceName)) {
      return true
    }

    if (topic && !this.traceContext.involvedTopics.has(topic)) {
      return true
    }

    return false
  }

  /**
   * 색상 매핑 유틸리티
   */
  protected getColor(tailwindClass: string): string {
    const colorMap: Record<string, string> = {
      'bg-purple-500': '#a855f7',
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-orange-500': '#f97316',
    }
    return colorMap[tailwindClass] || '#3b82f6'
  }
}
