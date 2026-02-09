import { useCallback, useEffect, useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
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

  // 토폴로지 데이터 → World 생성
  useEffect(() => {
    if (!topology) return

    const newWorld = new TopologyWorld(topology, traceContext)
    setWorld(newWorld)
  }, [topology, traceContext])

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
      return true
    })

    const { nodes: rawNodes, edges: rawEdges } = renderer.render(filteredItems, eventMode)
    const { nodes: layoutedNodes, edges: layoutedEdges } = renderer.applyLayout(
      rawNodes,
      rawEdges,
      'TB'
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [world, filters, eventMode, renderer, setNodes, setEdges])

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = renderer.applyLayout(
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

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="w-full h-full relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {traceContext ? `Trace: ${traceContext.traceId}` : '전체 Kafka 토폴로지'}
        </h2>
        <div className="flex gap-2 mb-3">
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
