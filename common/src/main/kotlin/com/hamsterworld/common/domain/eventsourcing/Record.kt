package com.hamsterworld.common.domain.eventsourcing

/**
 * 이벤트 소싱 기반 재집계가 가능한 도메인 마커 인터페이스
 *
 * Product처럼 ProductRecord로부터 상태를 재계산하는 도메인에 사용
 *
 * ## Event Sourcing Pattern
 * - Record: 이벤트 이력 (ProductRecord, OrderRecord 등)
 * - Aggregate: 재집계된 현재 상태 (Product, Order 등)
 *
 * ## 사용 예시
 * ```kotlin
 * data class Product(...) : Record {
 *     // ProductRecord 이력으로부터 stock을 재집계
 * }
 * ```
 */
interface Record
