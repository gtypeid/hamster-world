import type { Relation, RelatedIds, RelationResult } from '@/types/relation'
import type { IdType } from '@/types/navigation'

/**
 * RelationRegistry
 * - ID 타입 간의 관계 정의
 * - 백엔드가 relatedTraces를 제공하지 않을 때 fallback으로 사용
 */
class RelationRegistryClass {
  private relations: Relation[] = []

  /**
   * 관계 등록
   */
  register(relation: Relation) {
    this.relations.push(relation)
  }

  /**
   * 여러 관계 일괄 등록
   */
  registerMany(relations: Relation[]) {
    this.relations.push(...relations)
  }

  /**
   * 특정 ID 타입에서 출발하는 모든 관계 조회
   */
  getRelationsFrom(fromType: IdType): Relation[] {
    return this.relations.filter((r) => r.from === fromType)
  }

  /**
   * 특정 ID 타입으로 도착하는 모든 관계 조회
   */
  getRelationsTo(toType: IdType): Relation[] {
    return this.relations.filter((r) => r.to === toType)
  }

  /**
   * 특정 ID의 관련 ID들 조회
   * - data: 백엔드 API 응답 객체
   * - fromId: 시작 ID 값
   * - fromType: 시작 ID 타입
   */
  async resolveRelations(
    data: any,
    fromId: string,
    fromType: IdType
  ): Promise<RelatedIds> {
    const relations = this.getRelationsFrom(fromType)
    const results: RelationResult[] = []

    for (const relation of relations) {
      let toId: string | string[] | null = null

      // 1. field가 지정된 경우: data 객체에서 추출
      if (relation.field && data) {
        toId = data[relation.field] || null
      }

      // 2. fetch 함수가 지정된 경우: 백엔드에서 가져오기
      if (!toId && relation.fetch) {
        try {
          toId = await relation.fetch(fromId)
        } catch (error) {
          console.error(`Failed to fetch relation for ${fromId}:`, error)
        }
      }

      if (toId) {
        results.push({
          from: { id: fromId, type: fromType },
          to: { id: toId, type: relation.to },
          relation,
        })
      }
    }

    return {
      sourceId: fromId,
      sourceType: fromType,
      relations: results,
    }
  }

  /**
   * 전체 관계 목록
   */
  getAll(): Relation[] {
    return this.relations
  }
}

// Singleton
export const RelationRegistry = new RelationRegistryClass()
