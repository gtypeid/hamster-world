import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import { fetchTopology } from '@/api/topologyService'
import type { TopologyResponse, TraceContext } from '@/types/topology'
import { ServiceRegistry } from '@/components/navigation/registry/ServiceRegistry'

interface TopologyViewerProps {
  traceContext?: TraceContext
}

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const serviceNodeWidth = 250
const serviceNodeHeight = 120
const publisherNodeWidth = 200
const publisherNodeHeight = 70
const consumerNodeWidth = 200
const consumerNodeHeight = 70
const topicNodeWidth = 200
const topicNodeHeight = 80
const eventNodeWidth = 180
const eventNodeHeight = 60

/**
 * Dagre 자동 레이아웃 계산
 */
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 })

  nodes.forEach((node) => {
    let width = serviceNodeWidth
    let height = serviceNodeHeight

    if (node.id.startsWith('publisher-')) {
      width = publisherNodeWidth
      height = publisherNodeHeight
    } else if (node.id.startsWith('consumer-')) {
      width = consumerNodeWidth
      height = consumerNodeHeight
    } else if (node.id.startsWith('topic-')) {
      width = topicNodeWidth
      height = topicNodeHeight
    } else if (node.id.startsWith('event-')) {
      width = eventNodeWidth
      height = eventNodeHeight
    }

    dagreGraph.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    let width = serviceNodeWidth
    let height = serviceNodeHeight

    if (node.id.startsWith('publisher-')) {
      width = publisherNodeWidth
      height = publisherNodeHeight
    } else if (node.id.startsWith('consumer-')) {
      width = consumerNodeWidth
      height = consumerNodeHeight
    } else if (node.id.startsWith('topic-')) {
      width = topicNodeWidth
      height = topicNodeHeight
    } else if (node.id.startsWith('event-')) {
      width = eventNodeWidth
      height = eventNodeHeight
    }

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
 * 서비스명 → ServiceType 매핑
 */
function getServiceType(serviceName: string): 'payment' | 'gateway' | 'ecommerce' | 'notification' | null {
  if (serviceName.includes('payment')) return 'payment'
  if (serviceName.includes('gateway')) return 'gateway'
  if (serviceName.includes('ecommerce')) return 'ecommerce'
  if (serviceName.includes('notification')) return 'notification'
  if (serviceName.includes('progression')) return 'notification'
  return null
}

/**
 * TopologyResponse → React Flow 노드/엣지 변환
 */
function buildGraphFromTopology(
  topology: TopologyResponse,
  traceContext?: TraceContext
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const topicNodes = new Map<string, Node>()

  // 1. 서비스 노드 생성
  topology.services.forEach((service) => {
    const serviceType = getServiceType(service.serviceName)
    const serviceConfig = serviceType ? ServiceRegistry.get(serviceType) : null

    const isInactive = traceContext && !traceContext.involvedServices.has(service.serviceName)

    // 서비스별 실제 색상 매핑
    const colorMap: Record<string, string> = {
      'bg-purple-500': '#a855f7',
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-orange-500': '#f97316',
    }
    const bgColor = isInactive ? '#f3f4f6' : (serviceConfig?.color ? colorMap[serviceConfig.color] : '#3b82f6')

    nodes.push({
      id: `service-${service.serviceName}`,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="text-[9px] font-bold text-white bg-black bg-opacity-30 px-2 py-0.5 rounded-t mb-2">
              SERVICE
            </div>
            <div className="text-2xl mb-2">{serviceConfig?.icon || '📦'}</div>
            <div className="text-sm font-bold text-white">{service.serviceName}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 }, // Dagre가 계산
      style: {
        background: bgColor,
        color: 'white',
        border: '3px solid #1f2937',
        borderRadius: '12px',
        padding: '0',
        width: serviceNodeWidth,
        height: serviceNodeHeight,
        opacity: isInactive ? 0.3 : 1,
      },
    })
  })

  // 2. 토픽별 이벤트 수집
  topology.services.forEach((service) => {
    service.publishes.forEach((pub) => {
      if (!topicEvents.has(pub.topic)) {
        topicEvents.set(pub.topic, new Set())
      }
      pub.events.forEach((event) => topicEvents.get(pub.topic)!.add(event))
    })

    service.subscribes.forEach((sub) => {
      if (!topicEvents.has(sub.topic)) {
        topicEvents.set(sub.topic, new Set())
      }
      sub.events.forEach((event) => topicEvents.get(sub.topic)!.add(event))
    })
  })

  // 3. 토픽 노드 생성
  topicEvents.forEach((events, topic) => {
    const topicId = `topic-${topic}`
    const isInactive = traceContext && !traceContext.involvedTopics.has(topic)

    topicNodes.set(topicId, {
      id: topicId,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="text-[9px] font-bold text-yellow-900 bg-yellow-200 px-2 py-0.5 rounded-t mb-1">
              TOPIC
            </div>
            <div className="text-lg mb-1">📨</div>
            <div className="text-xs font-bold text-yellow-900">{topic}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: isInactive ? '#f9fafb' : '#fef3c7',
        color: '#92400e',
        border: '2px solid #d97706',
        borderRadius: '8px',
        padding: '0',
        width: topicNodeWidth,
        height: topicNodeHeight,
        opacity: isInactive ? 0.3 : 1,
      },
    })
  })

  // 4. 이벤트 노드 생성
  topicEvents.forEach((events, topic) => {
    events.forEach((eventName) => {
      const eventId = `event-${topic}-${eventName}`
      const isInactive = traceContext && !traceContext.involvedTopics.has(topic)

      nodes.push({
        id: eventId,
        type: 'default',
        data: {
          label: (
            <div className="text-center">
              <div className="text-[8px] font-bold text-purple-900 bg-purple-200 px-1 py-0.5 rounded-t mb-1">
                EVENT
              </div>
              <div className="text-[11px] font-bold text-purple-900">{eventName}</div>
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
          width: eventNodeWidth,
          height: eventNodeHeight,
          opacity: isInactive ? 0.3 : 1,
        },
      })

      // Topic → Event 엣지
      edges.push({
        id: `edge-topic-event-${topic}-${eventName}`,
        source: `topic-${topic}`,
        target: eventId,
        animated: false,
        style: {
          stroke: isInactive ? '#e5e7eb' : '#c084fc',
          strokeWidth: 1,
          strokeDasharray: '5,5',
          opacity: isInactive ? 0.3 : 0.6,
        },
      })
    })
  })

  // 5. 서비스 → 토픽 연결 (발행)
  topology.services.forEach((service) => {
    service.publishes.forEach((pub) => {
      const topicId = `topic-${pub.topic}`
      const isInactive =
        traceContext &&
        (!traceContext.involvedServices.has(service.serviceName) ||
          !traceContext.involvedTopics.has(pub.topic))

      edges.push({
        id: `edge-service-topic-${service.serviceName}-${pub.topic}`,
        source: `service-${service.serviceName}`,
        target: topicId,
        label: 'publishes to',
        animated: !isInactive,
        style: {
          stroke: isInactive ? '#d1d5db' : '#10b981',
          strokeWidth: 3,
          opacity: isInactive ? 0.3 : 1,
        },
        labelStyle: {
          fill: '#059669',
          fontSize: 10,
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: '#d1fae5',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isInactive ? '#d1d5db' : '#10b981',
        },
      })
    })
  })

  // 6. 토픽 → 서비스 연결 (구독)
  topology.services.forEach((service) => {
    service.subscribes.forEach((sub) => {
      const topicId = `topic-${sub.topic}`
      const isInactive =
        traceContext &&
        (!traceContext.involvedServices.has(service.serviceName) ||
          !traceContext.involvedTopics.has(sub.topic))

      edges.push({
        id: `edge-topic-service-${sub.topic}-${service.serviceName}`,
        source: topicId,
        target: `service-${service.serviceName}`,
        label: 'consumed by',
        animated: !isInactive,
        style: {
          stroke: isInactive ? '#d1d5db' : '#3b82f6',
          strokeWidth: 3,
          opacity: isInactive ? 0.3 : 1,
        },
        labelStyle: {
          fill: '#2563eb',
          fontSize: 10,
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: '#dbeafe',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isInactive ? '#d1d5db' : '#3b82f6',
        },
      })
    })
  })

  // 7. 서비스 ↔ 이벤트 엣지 생성 (세부)
  topology.services.forEach((service) => {
    // 발행 (Service → Event)
    service.publishes.forEach((pub) => {
      pub.events.forEach((eventName) => {
        const eventId = `event-${pub.topic}-${eventName}`
        const isInactive =
          traceContext &&
          (!traceContext.involvedServices.has(service.serviceName) ||
            !traceContext.involvedTopics.has(pub.topic))

        edges.push({
          id: `edge-pub-${service.serviceName}-${eventName}`,
          source: `service-${service.serviceName}`,
          target: eventId,
          animated: !isInactive,
          style: {
            stroke: isInactive ? '#d1d5db' : '#10b981',
            strokeWidth: 1,
            opacity: isInactive ? 0.2 : 0.4,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isInactive ? '#d1d5db' : '#10b981',
          },
        })
      })
    })

    // 구독 (Event → Service)
    service.subscribes.forEach((sub) => {
      sub.events.forEach((eventName) => {
        const eventId = `event-${sub.topic}-${eventName}`
        const isInactive =
          traceContext &&
          (!traceContext.involvedServices.has(service.serviceName) ||
            !traceContext.involvedTopics.has(sub.topic))

        edges.push({
          id: `edge-sub-${eventName}-${service.serviceName}`,
          source: eventId,
          target: `service-${service.serviceName}`,
          animated: !isInactive,
          style: {
            stroke: isInactive ? '#d1d5db' : '#3b82f6',
            strokeWidth: 1,
            opacity: isInactive ? 0.2 : 0.4,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isInactive ? '#d1d5db' : '#3b82f6',
          },
        })
      })
    })
  })

  // 토픽 노드를 nodes 배열에 추가
  nodes.push(...Array.from(topicNodes.values()))

  return { nodes, edges }
}

export function TopologyViewer({ traceContext }: TopologyViewerProps) {
  const [topology, setTopology] = useState<TopologyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // API 호출
  useEffect(() => {
    const loadTopology = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchTopology()
        setTopology(data)
      } catch (err) {
        console.error('Failed to load topology:', err)
        setError('토폴로지를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTopology()
  }, [])

  // 토폴로지 데이터 → React Flow 그래프 변환
  useEffect(() => {
    if (!topology) return

    const { nodes: rawNodes, edges: rawEdges } = buildGraphFromTopology(topology, traceContext)
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      rawEdges,
      'TB' // Top to Bottom
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [topology, traceContext, setNodes, setEdges])

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      )

      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    },
    [nodes, edges, setNodes, setEdges]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">토폴로지 로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="font-bold mb-2">❌ {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {traceContext ? `Trace: ${traceContext.traceId}` : '전체 Kafka 토폴로지'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onLayout('TB')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
          >
            세로 배치
          </button>
          <button
            onClick={() => onLayout('LR')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
          >
            가로 배치
          </button>
        </div>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls position="top-right" />
        <Background />
      </ReactFlow>
    </div>
  )
}
