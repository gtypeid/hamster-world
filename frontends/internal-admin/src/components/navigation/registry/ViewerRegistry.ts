import type { ViewerType, ViewerConfig } from '@/types/navigation'

/**
 * ViewerRegistry
 * - ViewerType과 실제 뷰어 컴포넌트 매핑
 * - 확장 가능: 새로운 뷰어 추가 시 register() 호출
 */
class ViewerRegistryClass {
  private viewers = new Map<ViewerType, ViewerConfig>()

  /**
   * 뷰어 등록
   */
  register(config: ViewerConfig) {
    this.viewers.set(config.type, config)
  }

  /**
   * 뷰어 조회
   */
  get(type: ViewerType): ViewerConfig | undefined {
    return this.viewers.get(type)
  }

  /**
   * 전체 뷰어 목록
   */
  getAll(): ViewerConfig[] {
    return Array.from(this.viewers.values())
  }

  /**
   * 뷰어 존재 여부
   */
  has(type: ViewerType): boolean {
    return this.viewers.has(type)
  }
}

// Singleton
export const ViewerRegistry = new ViewerRegistryClass()
