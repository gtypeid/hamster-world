import type { Node, Edge } from 'reactflow'
import { MarkerType } from 'reactflow'
import { TopologyWorldItem } from './TopologyWorldItem.tsx'

export type EdgeRelationType =
  | 'service-publisher'   // Service → Publisher
  | 'publisher-topic'     // Publisher → Topic
  | 'topic-consumer'      // Topic → Consumer
  | 'consumer-service'    // Consumer → Service
  | 'publisher-event'     // Publisher → Event
  | 'event-consumer'      // Event → Consumer (새로 추가)

const EDGE_STYLES: Record<EdgeRelationType, { stroke: string; strokeWidth: number; markerColor?: string; dashed?: boolean; label?: string }> = {
  'service-publisher': {
    stroke: '#dc2626',
    strokeWidth: 2,
    markerColor: '#dc2626',
  },
  'publisher-topic': {
    stroke: '#10b981',
    strokeWidth: 3,
    markerColor: '#10b981',
    label: 'publishes',
  },
  'topic-consumer': {
    stroke: '#3b82f6',
    strokeWidth: 3,
    markerColor: '#3b82f6',
    label: 'consumed',
  },
  'consumer-service': {
    stroke: '#2563eb',
    strokeWidth: 2,
    markerColor: '#2563eb',
  },
  'publisher-event': {
    stroke: '#c084fc',
    strokeWidth: 1,
    dashed: true,
  },
  'event-consumer': {
    stroke: '#10b981',
    strokeWidth: 2,
    dashed: true,
    label: '→',
  },
}

/**
 * 엣지 관계 아이템
 * - 모든 엣지를 아이템으로 정의하여 필터 가능하게 함
 */
export class EdgeRelationItem extends TopologyWorldItem {
  constructor(
    private type: EdgeRelationType,
    private source: string,
    private target: string,
    traceContext?: any
  ) {
    super(traceContext)
  }

  getType(): EdgeRelationType {
    return this.type
  }

  render(): { nodes: Node[]; edges: Edge[] } {
    const isInactive = this.isInactive()
    const style = EDGE_STYLES[this.type]

    const edge: Edge = {
      id: `edge-${this.type}-${this.source}-${this.target}`,
      source: this.source,
      target: this.target,
      animated: !isInactive,
      style: {
        stroke: isInactive ? '#d1d5db' : style.stroke,
        strokeWidth: style.strokeWidth,
        strokeDasharray: style.dashed ? '5,5' : undefined,
        opacity: isInactive ? 0.3 : style.dashed ? 0.7 : 1,
      },
      ...(style.label && { label: style.label }),
      ...(style.label && {
        labelStyle: {
          fill: isInactive ? '#d1d5db' : style.stroke,
          fontSize: style.label === '→' ? 12 : 10,
          fontWeight: 700,
        },
      }),
      ...(style.label && style.label !== '→' && {
        labelBgStyle: {
          fill: isInactive ? '#f3f4f6' : this.getLabelBgColor(this.type),
          fillOpacity: 0.9,
        },
      }),
      ...(style.markerColor && {
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isInactive ? '#d1d5db' : style.markerColor,
        },
      }),
    }

    return { nodes: [], edges: [edge] }
  }

  private getLabelBgColor(type: EdgeRelationType): string {
    const bgMap: Record<EdgeRelationType, string> = {
      'service-publisher': '#fee2e2',
      'publisher-topic': '#d1fae5',
      'topic-consumer': '#dbeafe',
      'consumer-service': '#dbeafe',
      'publisher-event': '#f3e8ff',
      'event-consumer': '#d1fae5',
    }
    return bgMap[type] || '#f3f4f6'
  }
}
