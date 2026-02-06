import { useNavigation } from './NavigationContext'
import { ViewerRegistry } from './registry/ViewerRegistry'
import { ServiceRegistry } from './registry/ServiceRegistry'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { GenericDataViewer } from './viewers/GenericDataViewer'

/**
 * TracerPane
 * - Navigation System의 오른쪽 팬
 * - 클릭한 ID의 상세 정보 표시
 * - ViewerRegistry에서 적절한 뷰어 컴포넌트 가져와서 렌더링
 */
export function TracerPane() {
  const { state, goBack, goForward, clear } = useNavigation()

  const currentItem = state.stack.items[state.stack.currentIndex]
  const canGoBack = state.stack.currentIndex > 0
  const canGoForward = state.stack.currentIndex < state.stack.items.length - 1

  // "내 아이템 가기" 핸들러
  const handleGoToMyItem = () => {
    const viewerConfig = ViewerRegistry.get(currentItem.viewerType)
    if (!viewerConfig?.myItem || viewerConfig.myItem === false) return

    // 커스텀 listRoute가 있으면 사용, 없으면 ServiceRegistry에서 가져오기
    const route = viewerConfig.myItem.listRoute
      ? viewerConfig.myItem.listRoute
      : ServiceRegistry.get(viewerConfig.service).listRoute

    const searchCondition = viewerConfig.myItem.searchBy(currentItem.id)

    // URL에 검색 파라미터 추가
    const params = new URLSearchParams()
    params.set('searchBy', searchCondition.field)
    params.set('searchValue', searchCondition.value)

    // window.history.pushState를 사용해서 페이지 리로드 없이 URL만 변경
    const newUrl = `${route}?${params.toString()}`
    window.history.pushState({}, '', newUrl)

    // popstate 이벤트 발생시켜서 React Router가 감지하도록
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  // 현재 아이템이 없는 경우
  if (!currentItem && !state.isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          message="선택된 항목이 없어요"
          submessage="ID를 클릭하면 여기에 상세 정보가 표시됩니다 🔍"
        />
      </div>
    )
  }

  // 로딩 중
  if (state.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // 에러 발생
  if (state.error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-2">⚠️ 오류 발생</p>
          <p className="text-gray-600">{state.error}</p>
          <button
            onClick={clear}
            className="mt-4 px-4 py-2 bg-hamster-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  // 뷰어 찾기
  const viewerConfig = ViewerRegistry.get(currentItem.viewerType)
  if (!viewerConfig) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-2">⚠️ 뷰어를 찾을 수 없어요</p>
          <p className="text-gray-600">ViewerType: {currentItem.viewerType}</p>
          <button
            onClick={clear}
            className="mt-4 px-4 py-2 bg-hamster-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  // 서비스 정보 가져오기
  const serviceConfig = ServiceRegistry.get(viewerConfig.service)

  return (
    <div className="h-full flex flex-col">
      {/* Header: Navigation Controls */}
      <div className="flex-shrink-0 bg-white border-b-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Service Badge - 맨 앞에 강조 */}
            <span className={`px-3 py-1 ${serviceConfig.color} text-white text-sm font-bold rounded-lg`}>
              {serviceConfig.icon} {serviceConfig.name}
            </span>
            <h3 className="text-lg font-bold text-hamster-brown">{viewerConfig.title}</h3>
          </div>
          <button
            onClick={clear}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* ID Label */}
        <div className="text-sm text-gray-600 mb-3 font-mono">{currentItem.label}</div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              canGoBack
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="뒤로 가기"
          >
            ← 뒤로
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              canGoForward
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="앞으로 가기"
          >
            앞으로 →
          </button>

          {/* "내 아이템 가기" 버튼 */}
          {viewerConfig.myItem && viewerConfig.myItem !== false && (
            <button
              onClick={handleGoToMyItem}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              📍 내 아이템 가기
            </button>
          )}

          <div className="flex-1"></div>
          <span className="text-sm text-gray-500">
            {state.stack.currentIndex + 1} / {state.stack.items.length}
          </span>
        </div>
      </div>

      {/* Body: GenericDataViewer - 자동으로 데이터 로드 및 Viewer 렌더링 */}
      <div className="flex-1 overflow-auto p-6">
        <GenericDataViewer
          id={currentItem.id}
          type={currentItem.viewerType}
          data={currentItem.data}
        />
      </div>
    </div>
  )
}
