import { useState, useEffect } from 'react'
import { ViewerRegistry } from '../registry/ViewerRegistry'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { ViewerProps, ViewerType } from '@/types/navigation'

interface GenericDataViewerProps {
  id: string
  type: ViewerType
  data?: any
}

/**
 * GenericDataViewer
 * - ViewerRegistry에 등록된 fetcher를 사용해 자동으로 데이터 로드
 * - fetcher가 없으면 "단독 조회 불가" 메시지 표시
 * - 로딩/에러 상태 자동 처리
 */
export function GenericDataViewer({ id, type, data: initialData }: GenericDataViewerProps) {
  const [data, setData] = useState<any>(initialData || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const viewerConfig = ViewerRegistry.get(type)

  useEffect(() => {
    // 뷰어 타입이나 ID가 변경되면 데이터 초기화
    setData(null)
    setError(null)
    setIsLoading(false)

    // 이미 data가 전달되었으면 API 호출 안함
    if (initialData) {
      setData(initialData)
      setIsLoading(false)
      return
    }

    // Viewer Config가 없으면 에러
    if (!viewerConfig) {
      setError(`Viewer type "${type}"이 등록되지 않았습니다.`)
      return
    }

    // fetcher가 없으면 단독 조회 불가
    if (!viewerConfig.fetcher) {
      if (viewerConfig.isEmbeddedOnly) {
        setError('이 ID는 단독 조회가 불가능합니다. 부모 데이터에 포함되어 있습니다.')
      } else {
        setError('데이터를 불러올 수 없습니다. fetcher가 설정되지 않았습니다.')
      }
      return
    }

    // API 호출
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await viewerConfig.fetcher!(id)
        setData(result)
      } catch (err) {
        console.error(`[GenericDataViewer] Failed to fetch data for ${type}:`, err)
        setError(`데이터를 불러오는데 실패했습니다.`)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, type, initialData, viewerConfig])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    )
  }

  // 에러 발생
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p className="font-bold mb-2">❌ {error}</p>
        <p className="text-xs text-gray-500 mt-2">
          {type}: {id}
        </p>
      </div>
    )
  }

  // Viewer Config 없음
  if (!viewerConfig) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p className="font-bold mb-2">⚠️ Viewer를 찾을 수 없습니다</p>
        <p className="text-sm">ViewerType: {type}</p>
      </div>
    )
  }

  // 실제 Viewer 컴포넌트 렌더링
  const ViewerComponent = viewerConfig.component

  return <ViewerComponent id={id} type={type as any} data={data} />
}
