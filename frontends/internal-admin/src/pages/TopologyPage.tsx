import { useEffect, useState } from 'react'
import { TopologyViewer } from '@common/topology'
import type { TopologyResponse } from '@common/topology'
import type { TopologyTraceContext } from '@common/topology'
import { fetchTopology } from '@/api/topologyService'
import { ServiceItem } from '@common/topology'
import { ServiceRegistry } from '@/components/navigation/registry/ServiceRegistry'
import { ALL_MOCK_TRACE_CONTEXTS } from '@/features/notification/mockTopologyTraceContext'

// internal-admin 전용: ServiceRegistry를 ServiceItem에 연결
ServiceItem.setConfigResolver({
  getIconAndColor(serviceName: string) {
    const typeMap: Record<string, 'payment' | 'gateway' | 'ecommerce' | 'notification'> = {}
    if (serviceName.includes('payment')) typeMap[serviceName] = 'payment'
    else if (serviceName.includes('gateway')) typeMap[serviceName] = 'gateway'
    else if (serviceName.includes('ecommerce')) typeMap[serviceName] = 'ecommerce'
    else if (serviceName.includes('notification')) typeMap[serviceName] = 'notification'
    else if (serviceName.includes('progression')) typeMap[serviceName] = 'notification'

    const serviceType = typeMap[serviceName]
    if (!serviceType) return null

    const config = ServiceRegistry.get(serviceType)
    return { icon: config.icon, color: config.color }
  },
})

export function TopologyPage() {
  const [topology, setTopology] = useState<TopologyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topologyTraceContext, setTopologyTraceContext] = useState<TopologyTraceContext | undefined>(undefined)

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

  const handleRandomScenario = () => {
    const randomIndex = Math.floor(Math.random() * ALL_MOCK_TRACE_CONTEXTS.length)
    setTopologyTraceContext(ALL_MOCK_TRACE_CONTEXTS[randomIndex].context)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">토폴로지 로딩 중...</div>
      </div>
    )
  }

  if (error || !topology) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="font-bold mb-2">{error || '데이터 없음'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative">
      <TopologyViewer
        topology={topology}
        topologyTraceContext={topologyTraceContext}
        config={{
          minimap: true,
          controls: true,
          background: true,
          controlPanel: true,
        }}
      />

      {/* 랜덤 트레이스 버튼 (internal-admin 전용) */}
      <button
        onClick={handleRandomScenario}
        className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg"
        title="DLQ 메시지 시나리오를 랜덤으로 선택하여 토폴로지 필터링 테스트"
      >
        랜덤 트레이스
      </button>
    </div>
  )
}
