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
   * 책임 분리: 마커 노드와 토폴로지 노드를 분리하여 처리
   * - 토폴로지 노드만 Dagre 레이아웃 적용
   * - 마커 노드는 대상 노드 위치 기반으로 배치
   */
  applyLayout(
    nodes: Node[],
    edges: Edge[],
    direction: 'TB' | 'LR' = 'TB'
  ): { nodes: Node[]; edges: Edge[] } {
    // 1. 마커 노드와 토폴로지 노드 분리
    const markerNodes = nodes.filter((node) => this.isMarkerNode(node.id))
    const topologyNodes = nodes.filter((node) => !this.isMarkerNode(node.id))

    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: 50,  // 노드 간 간격
      ranksep: 150  // 계층 간 간격
    })

    // 2. 토폴로지 노드만 Dagre에 등록 (마커는 제외)
    topologyNodes.forEach((node) => {
      const nodeType = this.getNodeType(node.id)
      const width = NODE_WIDTHS[nodeType] || 200
      const height = NODE_HEIGHTS[nodeType] || 80

      dagreGraph.setNode(node.id, { width, height })
    })

    // 3. 엣지 설정 (계층별 가중치)
    edges.forEach((edge) => {
      // 마커 노드는 엣지 대상이 될 수 없으므로 스킵
      if (this.isMarkerNode(edge.source) || this.isMarkerNode(edge.target)) {
        return
      }

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

    // 4. 토폴로지 노드 레이아웃 계산
    dagre.layout(dagreGraph)

    // 5. 토폴로지 노드 위치 업데이트
    const layoutedTopologyNodes = topologyNodes.map((node) => {
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

    // 6. 마커 노드 위치 결정 (대상 노드 기반)
    const positionedMarkerNodes = markerNodes.map((node) => {
      return this.positionMarkerNode(node, layoutedTopologyNodes, direction)
    })

    // 7. 마커와 토폴로지 노드 재결합
    const allPositionedNodes = [...layoutedTopologyNodes, ...positionedMarkerNodes]

    return { nodes: allPositionedNodes, edges }
  }

  /**
   * 마커 노드 여부 판단
   * - root-entry-point: 시작점 마커
   * - status-indicator-: 서비스 수준 성공/실패 마커
   * - event-success-marker-: 이벤트 성공 마커 (작음)
   * - event-failure-marker-: 이벤트 실패 마커 (큼)
   */
  private isMarkerNode(nodeId: string): boolean {
    return (
      nodeId.startsWith('root-entry-point') ||
      nodeId.startsWith('status-indicator-') ||
      nodeId.startsWith('event-success-marker-') ||
      nodeId.startsWith('event-failure-marker-')
    )
  }

  /**
   * 마커 노드 위치 결정
   * - 레이아웃 방향에 따라 오프셋 조정
   * - Root Entry Point: 목표 노드 위쪽/왼쪽
   * - Failed Status: 목표 노드 오른쪽/아래쪽
   * - Success Status: 고정 위치 (우측 상단)
   *
   * 책임분리:
   * - 각 마커는 독립적으로 배치되고 Dagre 레이아웃에 영향 없음
   * - 대상 노드와 완전히 분리되어 관리됨
   */
  private positionMarkerNode(
    markerNode: Node,
    layoutedNodes: Node[],
    direction: 'TB' | 'LR'
  ): Node {
    // Root Entry Point 마커 처리
    if (markerNode.id === 'root-entry-point') {
      const targetNodeId = (markerNode as any).data?.targetNodeId
      const targetNode = targetNodeId
        ? layoutedNodes.find((n) => n.id === targetNodeId)
        : undefined

      if (targetNode) {
        const offsetX = direction === 'LR' ? -120 : 0
        const offsetY = direction === 'LR' ? 0 : -120

        return {
          ...markerNode,
          position: {
            x: targetNode.position.x + offsetX,
            y: targetNode.position.y + offsetY,
          },
        }
      }
    }

    // Status Indicator 마커 처리 (실패)
    // ID 형식: status-indicator-failed-{serviceName}
    if (markerNode.id.startsWith('status-indicator-failed-')) {
      const targetNodeId = (markerNode as any).data?.targetNodeId
      if (targetNodeId) {
        const targetNode = layoutedNodes.find((n) => n.id === targetNodeId)
        if (targetNode) {
          // TB 모드: 우측 아래, LR 모드: 우측 아래
          // 더 큰 오프셋으로 명확하게 보임
          const offsetX = 200  // 서비스 노드 우측에 충분히 멀리
          const offsetY = direction === 'LR' ? 150 : 100  // 아래쪽

          return {
            ...markerNode,
            position: {
              x: targetNode.position.x + offsetX,
              y: targetNode.position.y + offsetY,
            },
          }
        }
      }
    }

    // Status Indicator 마커 처리 (성공)
    // ID 형식: status-indicator-success-{targetService}
    if (markerNode.id.startsWith('status-indicator-success-')) {
      // 성공 상태는 고정 위치 (레이아웃 방향 무관)
      return {
        ...markerNode,
        position: {
          x: 800,
          y: -100,
        },
      }
    }

    // Event Success/Failure 마커 처리 - 그룹 렌더링
    // 같은 이벤트 위에 여러 마커가 있으면 좌우로 분산시킴
    if (markerNode.id.startsWith('event-success-marker-') || markerNode.id.startsWith('event-failure-marker-')) {
      const targetNodeId = (markerNode as any).data?.targetNodeId
      if (targetNodeId) {
        const targetNode = layoutedNodes.find((n) => n.id === targetNodeId)
        if (targetNode) {
          // 마커 타입별 정렬 포인트
          const isSuccess = markerNode.id.startsWith('event-success-marker-')

          // 마커를 좌우로 분산: 성공은 좌측, 실패는 우측
          const offsetX = isSuccess ? -35 : 35  // ±35로 좌우 분산
          const offsetY = -50  // 이벤트 노드 위

          return {
            ...markerNode,
            position: {
              x: targetNode.position.x + offsetX,
              y: targetNode.position.y + offsetY,
            },
          }
        }
      }
    }

    return markerNode
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
