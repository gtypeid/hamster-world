package com.hamsterworld.notification.domain.dlq.repository

import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.notification.domain.dlq.constant.DLQStatus
import com.hamsterworld.notification.app.dlq.request.DLQSearchRequest
import com.hamsterworld.notification.domain.dlq.model.DLQMessage
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.query.Criteria
import org.springframework.data.mongodb.core.query.Query
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.time.LocalTime

/**
 * DLQ Message Repository (JPA-style Interface)
 *
 * 기본 CRUD는 MongoRepository가 제공
 */
interface DLQMessageJpaRepository : MongoRepository<DLQMessage, String> {
    fun countByStatus(status: DLQStatus): Long
    fun countByOriginalTopicAndStatus(topic: String, status: DLQStatus): Long
}

/**
 * DLQ Message Repository (Custom Implementation)
 *
 * Progression Service 패턴을 MongoDB에 적용:
 * - baseQuery() + searchListConditions() 패턴
 * - AppPagedSearchQuery 기반 동적 검색
 */
@Repository
class DLQMessageRepository(
    private val jpaRepository: DLQMessageJpaRepository,
    private val mongoTemplate: MongoTemplate
) {

    // ===== 기본 CRUD 위임 =====

    fun save(message: DLQMessage): DLQMessage {
        return jpaRepository.save(message)
    }

    fun findById(id: String): DLQMessage? {
        return jpaRepository.findById(id).orElse(null)
    }

    fun count(): Long {
        return jpaRepository.count()
    }

    fun countByStatus(status: DLQStatus): Long {
        return jpaRepository.countByStatus(status)
    }

    fun countByOriginalTopicAndStatus(topic: String, status: DLQStatus): Long {
        return jpaRepository.countByOriginalTopicAndStatus(topic, status)
    }

    // ===== 동적 검색 (Progression Service 패턴) =====

    /**
     * 검색 조건 기반 조회 (List)
     */
    fun findAll(search: DLQSearchRequest): List<DLQMessage> {
        val query = baseQuery(search)
        applySorts(query, search)
        return mongoTemplate.find(query, DLQMessage::class.java)
    }

    /**
     * 검색 조건 기반 조회 (Page)
     */
    fun findAllPage(search: DLQSearchRequest): Page<DLQMessage> {
        val query = baseQuery(search)

        // Count query
        val total = mongoTemplate.count(query, DLQMessage::class.java)

        // Paged query
        applySorts(query, search)
        query.skip(search.getOffset())
        query.limit(search.size)

        val messages = mongoTemplate.find(query, DLQMessage::class.java)

        return PageImpl(messages, PageRequest.of(search.page, search.size), total)
    }

    /**
     * 오래된 PENDING 메시지 조회 (3일 이상)
     */
    fun findOldPendingMessages(before: LocalDateTime): List<DLQMessage> {
        val query = Query()
        query.addCriteria(Criteria.where("status").`is`(DLQStatus.PENDING))
        query.addCriteria(Criteria.where("failedAt").lt(before))
        query.with(Sort.by(Sort.Direction.ASC, "failedAt"))
        return mongoTemplate.find(query, DLQMessage::class.java)
    }

    // ===== Private Helpers (Progression Service 패턴) =====

    /**
     * Base Query 생성
     *
     * searchListConditions()로 생성한 조건들을 모두 적용한 기본 쿼리
     */
    private fun baseQuery(search: DLQSearchRequest): Query {
        val query = Query()
        searchListConditions(search).forEach { criteria ->
            query.addCriteria(criteria)
        }
        return query
    }

    /**
     * 검색 조건 리스트 생성
     *
     * Progression Service의 searchListConditions() 패턴:
     * - null-safe 조건 생성
     * - Optional 필드는 null이면 무시
     */
    private fun searchListConditions(search: DLQSearchRequest): List<Criteria> {
        return listOfNotNull(
            // 1. 날짜 범위 조회 (failedAt)
            if (search.from != null && search.to != null) {
                Criteria.where("failedAt").gte(search.from.atStartOfDay()).lte(search.to.atTime(LocalTime.MAX))
            } else null,

            // 2. Public ID 목록 조회 (IN 연산)
            if (search.publicIds.isNotEmpty()) {
                Criteria.where("id").`in`(search.publicIds)
            } else null,

            // 3. 원본 토픽 조회
            if (search.originalTopic != null) {
                Criteria.where("originalTopic").`is`(search.originalTopic)
            } else null,

            // 4. Consumer Group 조회
            if (search.consumerGroup != null) {
                Criteria.where("consumerGroup").`is`(search.consumerGroup)
            } else null,

            // 5. 상태 조회
            if (search.status != null) {
                Criteria.where("status").`is`(search.status)
            } else null,

            // 6. 예외 클래스 조회 (부분 일치)
            if (search.exceptionClass != null) {
                Criteria.where("exceptionClass").regex(search.exceptionClass, "i")  // case-insensitive
            } else null,

            // ===== BaseDomainEvent 필드 검색 (외벽) =====

            // 7. Aggregate ID 조회
            if (search.aggregateId != null) {
                Criteria.where("aggregateId").`is`(search.aggregateId)
            } else null,

            // 8. Event ID 조회
            if (search.eventId != null) {
                Criteria.where("eventId").`is`(search.eventId)
            } else null,

            // 9. Trace ID 조회 (분산 추적)
            if (search.traceId != null) {
                Criteria.where("traceId").`is`(search.traceId)
            } else null,

            // 10. Event Type 조회
            if (search.eventType != null) {
                Criteria.where("eventType").`is`(search.eventType)
            } else null
        )
    }

    /**
     * 정렬 적용
     *
     * Progression Service의 applySorts() 패턴
     */
    private fun applySorts(query: Query, search: DLQSearchRequest) {
        val direction = when (search.sort) {
            SortDirection.ASC -> Sort.Direction.ASC
            SortDirection.DESC -> Sort.Direction.DESC
        }
        query.with(Sort.by(direction, "failedAt"))
    }
}
