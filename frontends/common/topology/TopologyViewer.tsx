import { useCallback, useEffect, useState, useMemo } from 'react'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { TopologyResponse, TraceContext } from './types/topology'
import type { TopologyTraceContext } from './types/topologyTraceContext'
import { TopologyWorld } from './TopologyWorld'
import { TopologyRenderer } from './TopologyRenderer'
import { ServiceItem } from './items/ServiceItem.tsx'
import { PublisherItem } from './items/PublisherItem.tsx'
import { ConsumerItem } from './items/ConsumerItem.tsx'
import { TopicItem } from './items/TopicItem.tsx'
import { EventItem } from './items/EventItem.tsx'
import { EdgeRelationItem } from './items/EdgeRelationItem.tsx'
import type { EdgeRelationType } from './items/EdgeRelationItem.tsx'

/**
 * TopologyViewer 설정
 * - 각 앱에서 필요한 기능만 활성화
 */
export interface TopologyViewerConfig {
  /** MiniMap 표시 여부 (기본: false) */
  minimap?: boolean
  /** Controls 표시 여부 (기본: true) */
  controls?: boolean
  /** 그리드 배경 표시 여부 (기본: true) */
  background?: boolean
  /** 컨트롤 패널 표시 여부 (기본: true) */
  controlPanel?: boolean
}

export interface TopologyViewerProps {
  /** 토폴로지 데이터 (외부에서 주입) */
  topology: TopologyResponse
  /** 트레이스 컨텍스트 (선택사항) */
  traceContext?: TraceContext
  /** 상세 트레이스 컨텍스트 (선택사항, 마커 생성용) */
  topologyTraceContext?: TopologyTraceContext
  /** 뷰어 설정 */
  config?: TopologyViewerConfig
}

const DEFAULT_CONFIG: TopologyViewerConfig = {
  minimap: false,
  controls: true,
  background: true,
  controlPanel: true,
}

function topologyTraceContextToTraceContext(
  topologyContext: TopologyTraceContext
): TraceContext {
  return {
    traceId: topologyContext.traceId,
    involvedServices: topologyContext.involvedServices,
    involvedTopics: topologyContext.involvedTopics,
  }
}

export function TopologyViewer({
  topology,
  traceContext,
  topologyTraceContext,
  config: userConfig,
}: TopologyViewerProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }

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

  // 실질적 트레이스 컨텍스트 결정
  const effectiveTraceContext = useMemo(
    () => traceContext || (topologyTraceContext ? topologyTraceContextToTraceContext(topologyTraceContext) : undefined),
    [traceContext, topologyTraceContext]
  )

  // 토폴로지 데이터 → World 생성
  useEffect(() => {
    if (!topology) return
    const newWorld = new TopologyWorld(topology, eventMode, effectiveTraceContext, topologyTraceContext)
    setWorld(newWorld)
  }, [topology, eventMode, effectiveTraceContext, topologyTraceContext])

  // World → React Flow 그래프 렌더링 (필터 적용)
  useEffect(() => {
    if (!world) return

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
      {config.controlPanel && (
        <div className="absolute top-4 left-4 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 max-w-sm">
          <h2 className="text-lg font-bold text-white mb-2">
            {effectiveTraceContext ? `Trace: ${effectiveTraceContext.traceId}` : 'Kafka Topology'}
          </h2>

          {/* 최초 시작점 표시 */}
          {topologyTraceContext && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 text-xs space-y-1">
              <div className="text-blue-900 font-semibold mb-2">📍 최초 진입점</div>
              <div className="text-blue-800">
                <span className="font-mono bg-white px-1 rounded">{topologyTraceContext.rootService}</span>
              </div>
              <div className="text-blue-800">
                Event: <span className="font-mono bg-white px-1 rounded">{topologyTraceContext.rootEventType}</span>
              </div>
              <div className="text-blue-800">
                Topic: <span className="font-mono bg-white px-1 rounded">{topologyTraceContext.rootTopic}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => onLayout('TB')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                layoutMode === 'TB'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              세로 배치
            </button>
            <button
              onClick={() => onLayout('LR')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                layoutMode === 'LR'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              가로 배치
            </button>
          </div>

          {/* 이벤트 모드 토글 */}
          <div className="border-t pt-3">
            <div className="text-xs font-semibold text-gray-300 mb-2">이벤트 표시</div>
            <div className="flex gap-2">
              <button
                onClick={() => setEventMode('single')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  eventMode === 'single'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                단일 소스
              </button>
              <button
                onClick={() => setEventMode('multi')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  eventMode === 'multi'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                각 구독자별
              </button>
            </div>
          </div>

          {/* 필터 버튼들 */}
          <div className="border-t pt-3 mt-3">
            <div className="text-xs font-semibold text-gray-300 mb-2">필터</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleAllFilters}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  Object.values(filters).every((v) => v)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => toggleFilter('service')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filters.service
                    ? 'bg-gray-800 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Service
              </button>
              <button
                onClick={() => toggleFilter('publisher')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filters.publisher
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Publisher
              </button>
              <button
                onClick={() => toggleFilter('consumer')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filters.consumer
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Consumer
              </button>
              <button
                onClick={() => toggleFilter('topic')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filters.topic
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Topic
              </button>
              <button
                onClick={() => toggleFilter('event')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filters.event
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Event
              </button>
            </div>
          </div>

          {/* 엣지 필터 */}
          <div className="border-t pt-3 mt-3">
            <div className="text-xs font-semibold text-gray-300 mb-2">엣지 필터</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleAllEdgeFilters}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  Object.values(edgeFilters).every((v) => v)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => toggleEdgeFilter('service-publisher')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  edgeFilters['service-publisher']
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Service→Pub
              </button>
              <button
                onClick={() => toggleEdgeFilter('publisher-topic')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  edgeFilters['publisher-topic']
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Pub→Topic
              </button>
              <button
                onClick={() => toggleEdgeFilter('topic-consumer')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  edgeFilters['topic-consumer']
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Topic→Con
              </button>
              <button
                onClick={() => toggleEdgeFilter('consumer-service')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  edgeFilters['consumer-service']
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Con→Service
              </button>
              <button
                onClick={() => toggleEdgeFilter('publisher-event')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  edgeFilters['publisher-event']
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Pub→Event
              </button>
              <button
                onClick={() => toggleEdgeFilter('event-consumer')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  edgeFilters['event-consumer']
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                Event→Con
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={4}
        fitView
        attributionPosition="bottom-left"
      >
        {config.controls && <Controls position="top-right" />}
        {config.background && <Background />}
        {config.minimap && (
          <MiniMap
            nodeColor={(node) => {
              const id = node.id
              if (id.startsWith('service-')) return '#3b82f6'
              if (id.startsWith('publisher-')) return '#dc2626'
              if (id.startsWith('consumer-')) return '#2563eb'
              if (id.startsWith('topic-')) return '#d97706'
              if (id.startsWith('event-')) return '#9333ea'
              return '#6b7280'
            }}
          />
        )}
      </ReactFlow>
    </div>
  )
}
