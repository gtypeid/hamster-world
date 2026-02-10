import type { Node, Edge } from 'reactflow'
import dagre from 'dagre'
import { TopologyWorldItem } from './items/TopologyWorldItem.tsx'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const NODE_WIDTHS: Record<string, number> = {
  service: 250,
  publisher: 200,
  consumer: 200,
  topic: 200,
  event: 180,
}

const NODE_HEIGHTS: Record<string, number> = {
  service: 120,
  publisher: 70,
  consumer: 90,
  topic: 80,
  event: 60,
}

/**
 * 토폴로지 렌더러
 * - 아이템들을 React Flow 노드/엣지로 변환
 * - Dagre 레이아웃 자동 계산
 */
export class TopologyRenderer {
  /**
   * 아이템들을 렌더링하여 노드/엣지 생성
   */
  render(items: TopologyWorldItem[], eventMode: 'single' | 'multi' = 'multi'): { nodes: Node[]; edges: Edge[] } {
    const allNodes: Node[] = []
    const allEdges: Edge[] = []

    // 각 아이템의 render() 호출 (EventItem에만 mode 전달)
    items.forEach((item) => {
      const result = item.render(eventMode)
      allNodes.push(...result.nodes)
      // EdgeRelationItem: edges 항상 반환
      // EventItem: Consumer 참조 엣지만 반환 (PublisherEvent는 엣지 없음)
      if ('edges' in result && result.edges) {
        allEdges.push(...result.edges)
      }
    })

    return { nodes: allNodes, edges: allEdges }
  }

  /**
   * Dagre 자동 레이아웃 적용
   */
  applyLayout(
    nodes: Node[],
    edges: Edge[],
    direction: 'TB' | 'LR' = 'TB'
  ): { nodes: Node[]; edges: Edge[] } {
    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: 50,  // 노드 간 간격 (100 → 50으로 줄임)
      ranksep: 150  // 계층 간 간격
    })

    // 노드 크기 설정
    nodes.forEach((node) => {
      const nodeType = this.getNodeType(node.id)
      const width = NODE_WIDTHS[nodeType] || 200
      const height = NODE_HEIGHTS[nodeType] || 80

      dagreGraph.setNode(node.id, { width, height })
    })

    // 엣지 설정 (계층별 가중치)
    edges.forEach((edge) => {
      let weight = 1 // 기본 가중치

      // Publisher/Consumer → Event: 매우 높은 가중치 (가장 밀집)
      if (edge.id.includes('edge-parent-event') || edge.id.includes('edge-consumer-ref')) {
        weight = 200
      }
      // Publisher → Topic: 극도로 높은 가중치 (토픽을 Publisher 근처에 고정)
      else if (edge.id.includes('edge-publisher-topic')) {
        weight = 300
      }
      // Service → Publisher/Consumer: 높은 가중치
      else if (edge.id.includes('edge-service-publisher') || edge.id.includes('edge-consumer-service')) {
        weight = 100
      }
      // Topic → Consumer: 낮은 가중치 (멀리 뻗어도 OK)
      else if (edge.id.includes('edge-topic-consumer')) {
        weight = 10
      }

      dagreGraph.setEdge(edge.source, edge.target, { weight })
    })

    // 레이아웃 계산
    dagre.layout(dagreGraph)

    // 노드 위치 업데이트
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      const nodeType = this.getNodeType(node.id)
      const width = NODE_WIDTHS[nodeType] || 200
      const height = NODE_HEIGHTS[nodeType] || 80

      return {
        ...node,
        position: {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        },
      }
    })

    return { nodes: layoutedNodes, edges }
  }

  /**
   * 노드 ID로부터 타입 추출
   */
  private getNodeType(nodeId: string): string {
    if (nodeId.startsWith('service-')) return 'service'
    if (nodeId.startsWith('publisher-')) return 'publisher'
    if (nodeId.startsWith('consumer-')) return 'consumer'
    if (nodeId.startsWith('topic-')) return 'topic'
    if (nodeId.startsWith('event-')) return 'event'
    return 'default'
  }
}
