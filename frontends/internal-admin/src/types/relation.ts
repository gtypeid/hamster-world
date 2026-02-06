// ID 관계 정의 Types

import type { IdType } from './navigation'

/**
 * 관계 타입
 */
export type RelationType =
  | 'belongs-to' // N:1 관계 (Process → Order)
  | 'has-many' // 1:N 관계 (Order → OrderItems)
  | 'has-one' // 1:1 관계 (Process → Payment)
  | 'references' // 외부 참조 (Product → EcommerceProduct)
  | 'traces-to' // 트레이싱 관계 (EventId → TraceId)
  | 'grouped-by' // 그룹 관계 (Events → TraceId)

/**
 * 관계 정의
 * - RelationRegistry에서 사용
 */
export interface Relation {
  from: IdType // 출발 ID 타입
  to: IdType // 도착 ID 타입
  type: RelationType
  label: string // UI 표시용 라벨
  field?: string // API 응답에서 해당 ID를 찾을 필드명
  fetch?: (fromId: string) => Promise<string | string[] | null> // 백엔드에서 가져오는 함수 (옵셔널)
}

/**
 * 관계 조회 결과
 */
export interface RelationResult {
  from: {
    id: string
    type: IdType
  }
  to: {
    id: string | string[]
    type: IdType
  }
  relation: Relation
}

/**
 * 관련 ID들
 * - 특정 ID와 연관된 모든 ID들
 */
export interface RelatedIds {
  sourceId: string
  sourceType: IdType
  relations: RelationResult[]
}
