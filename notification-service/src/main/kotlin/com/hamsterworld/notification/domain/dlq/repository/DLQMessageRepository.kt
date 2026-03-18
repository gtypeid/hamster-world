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

interface DLQMessageJpaRepository : MongoRepository<DLQMessage, String> {
    fun countByStatus(status: DLQStatus): Long
    fun countByOriginalTopicAndStatus(topic: String, status: DLQStatus): Long
}

@Repository
class DLQMessageRepository(
    private val jpaRepository: DLQMessageJpaRepository,
    private val mongoTemplate: MongoTemplate
) {

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

    fun findAll(search: DLQSearchRequest): List<DLQMessage> {
        val query = baseQuery(search)
        applySorts(query, search)
        return mongoTemplate.find(query, DLQMessage::class.java)
    }

    fun findAllPage(search: DLQSearchRequest): Page<DLQMessage> {
        val query = baseQuery(search)

        val total = mongoTemplate.count(query, DLQMessage::class.java)

        applySorts(query, search)
        query.skip(search.getOffset())
        query.limit(search.size)

        val messages = mongoTemplate.find(query, DLQMessage::class.java)

        return PageImpl(messages, PageRequest.of(search.page, search.size), total)
    }

    fun findOldPendingMessages(before: LocalDateTime): List<DLQMessage> {
        val query = Query()
        query.addCriteria(Criteria.where("status").`is`(DLQStatus.PENDING))
        query.addCriteria(Criteria.where("failedAt").lt(before))
        query.with(Sort.by(Sort.Direction.ASC, "failedAt"))
        return mongoTemplate.find(query, DLQMessage::class.java)
    }

    private fun baseQuery(search: DLQSearchRequest): Query {
        val query = Query()
        searchListConditions(search).forEach { criteria ->
            query.addCriteria(criteria)
        }
        return query
    }

    private fun searchListConditions(search: DLQSearchRequest): List<Criteria> {
        return listOfNotNull(
            if (search.from != null && search.to != null) {
                Criteria.where("failedAt").gte(search.from.atStartOfDay()).lte(search.to.atTime(LocalTime.MAX))
            } else null,

            if (search.publicIds.isNotEmpty()) {
                Criteria.where("id").`in`(search.publicIds)
            } else null,

            if (search.originalTopic != null) {
                Criteria.where("originalTopic").`is`(search.originalTopic)
            } else null,

            if (search.consumerGroup != null) {
                Criteria.where("consumerGroup").`is`(search.consumerGroup)
            } else null,

            if (search.status != null) {
                Criteria.where("status").`is`(search.status)
            } else null,

            if (search.exceptionClass != null) {
                Criteria.where("exceptionClass").regex(search.exceptionClass, "i")
            } else null,

            if (search.aggregateId != null) {
                Criteria.where("aggregateId").`is`(search.aggregateId)
            } else null,

            if (search.eventId != null) {
                Criteria.where("eventId").`is`(search.eventId)
            } else null,

            if (search.traceId != null) {
                Criteria.where("traceId").`is`(search.traceId)
            } else null,

            if (search.eventType != null) {
                Criteria.where("eventType").`is`(search.eventType)
            } else null
        )
    }

    private fun applySorts(query: Query, search: DLQSearchRequest) {
        val direction = when (search.sort) {
            SortDirection.ASC -> Sort.Direction.ASC
            SortDirection.DESC -> Sort.Direction.DESC
        }
        query.with(Sort.by(direction, "failedAt"))
    }
}
