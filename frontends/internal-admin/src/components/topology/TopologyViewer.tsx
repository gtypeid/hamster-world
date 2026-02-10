import { useCallback, useEffect, useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Edge as EdgeType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { fetchTopology } from '@/api/topologyService'
import type { TopologyResponse, TraceContext } from '@/types/topology'
import { TopologyWorld } from './TopologyWorld'
import { TopologyRenderer } from './TopologyRenderer'
import { ServiceItem } from './items/ServiceItem.tsx'
import { PublisherItem } from './items/PublisherItem.tsx'
import { ConsumerItem } from './items/ConsumerItem.tsx'
import { TopicItem } from './items/TopicItem.tsx'
import { EventItem } from './items/EventItem.tsx'
import { EdgeRelationItem } from './items/EdgeRelationItem.tsx'
import type { EdgeRelationType } from './items/EdgeRelationItem.tsx'

interface TopologyViewerProps {
  traceContext?: TraceContext
}

export function TopologyViewer({ traceContext }: TopologyViewerProps) {
  const [topology, setTopology] = useState<TopologyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [world, setWorld] = useState<TopologyWorld | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 필터 상태 (기본값: 모두 활성화)
  const [filters, setFilters] = useState({
    service: true,
    publisher: true,
    consumer: true,
    topic: true,
    event: true,
  })

  // 이벤트 렌더링 모드
  const [eventMode, setEventMode] = useState<'single' | 'multi'>('multi')

  // 배치 모드
  const [layoutMode, setLayoutMode] = useState<'TB' | 'LR'>('TB')

  // 엣지 필터 상태 (기본값: 모두 활성화)
  const [edgeFilters, setEdgeFilters] = useState({
    'service-publisher': true,
    'publisher-topic': true,
    'topic-consumer': true,
    'consumer-service': true,
    'publisher-event': true,
    'event-consumer': true,
  })

  const renderer = useMemo(() => new TopologyRenderer(), [])

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

  // 토폴로지 데이터 → World 생성 (eventMode 포함)
  useEffect(() => {
    if (!topology) return

    const newWorld = new TopologyWorld(topology, eventMode, traceContext)
    setWorld(newWorld)
  }, [topology, eventMode, traceContext])

  // World → React Flow 그래프 렌더링 (필터 적용)
  useEffect(() => {
    if (!world) return

    // 필터에 따라 아이템 선택
    const items = world.getItems()

    const filteredItems = items.filter((item) => {
      if (item instanceof ServiceItem) return filters.service
      if (item instanceof PublisherItem) return filters.publisher
      if (item instanceof ConsumerItem) return filters.consumer
      if (item instanceof TopicItem) return filters.topic
      if (item instanceof EventItem) return filters.event
      if (item instanceof EdgeRelationItem) {
        const edgeType = item.getType() as EdgeRelationType
        return edgeFilters[edgeType]
      }
      return true
    })

    const { nodes: rawNodes, edges: rawEdges } = renderer.render(filteredItems, eventMode)

    const { nodes: layoutedNodes, edges: layoutedEdges } = renderer.applyLayout(
      rawNodes,
      rawEdges,
      layoutMode
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [world, filters, eventMode, edgeFilters, layoutMode, renderer, setNodes, setEdges])

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = renderer.applyLayout(
        nodes,
        edges,
        direction
      )

      setLayoutMode(direction)
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

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleEdgeFilter = (key: keyof typeof edgeFilters) => {
    setEdgeFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleAllFilters = () => {
    const allOn = Object.values(filters).every((v) => v)
    const newValue = !allOn
    setFilters({
      service: newValue,
      publisher: newValue,
      consumer: newValue,
      topic: newValue,
      event: newValue,
    })
  }

  const toggleAllEdgeFilters = () => {
    const allOn = Object.values(edgeFilters).every((v) => v)
    const newValue = !allOn
    setEdgeFilters({
      'service-publisher': newValue,
      'publisher-topic': newValue,
      'topic-consumer': newValue,
      'consumer-service': newValue,
      'publisher-event': newValue,
      'event-consumer': newValue,
    })
  }

  return (
    <div className="w-full h-full relative">
      {/* Control Panel */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {traceContext ? `Trace: ${traceContext.traceId}` : '전체 Kafka 토폴로지'}
        </h2>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onLayout('TB')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              layoutMode === 'TB'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            세로 배치
          </button>
          <button
            onClick={() => onLayout('LR')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              layoutMode === 'LR'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            가로 배치
          </button>
        </div>

        {/* 이벤트 모드 토글 */}
        <div className="border-t pt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">이벤트 표시</div>
          <div className="flex gap-2">
            <button
              onClick={() => setEventMode('single')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                eventMode === 'single'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              단일 소스
            </button>
            <button
              onClick={() => setEventMode('multi')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                eventMode === 'multi'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              각 구독자별
            </button>
          </div>
        </div>

        {/* 필터 버튼들 */}
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">필터</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAllFilters}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                Object.values(filters).every((v) => v)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => toggleFilter('service')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.service
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Service
            </button>
            <button
              onClick={() => toggleFilter('publisher')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.publisher
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Publisher
            </button>
            <button
              onClick={() => toggleFilter('consumer')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.consumer
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Consumer
            </button>
            <button
              onClick={() => toggleFilter('topic')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.topic
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Topic
            </button>
            <button
              onClick={() => toggleFilter('event')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.event
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Event
            </button>
          </div>
        </div>

        {/* 엣지 필터 */}
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">엣지 필터</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAllEdgeFilters}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                Object.values(edgeFilters).every((v) => v)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => toggleEdgeFilter('service-publisher')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                edgeFilters['service-publisher']
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Service→Pub
            </button>
            <button
              onClick={() => toggleEdgeFilter('publisher-topic')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                edgeFilters['publisher-topic']
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Pub→Topic
            </button>
            <button
              onClick={() => toggleEdgeFilter('topic-consumer')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                edgeFilters['topic-consumer']
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Topic→Con
            </button>
            <button
              onClick={() => toggleEdgeFilter('consumer-service')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                edgeFilters['consumer-service']
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Con→Service
            </button>
            <button
              onClick={() => toggleEdgeFilter('publisher-event')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                edgeFilters['publisher-event']
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Pub→Event
            </button>
            <button
              onClick={() => toggleEdgeFilter('event-consumer')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                edgeFilters['event-consumer']
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              Event→Con
            </button>
          </div>
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
