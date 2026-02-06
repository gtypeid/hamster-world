package com.hamsterworld.common.domain.audit.handler

import com.hamsterworld.common.domain.audit.model.AuditLog
import com.hamsterworld.common.domain.audit.abs.AuditRelay
import com.hamsterworld.common.domain.audit.abs.AuditableTarget
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import com.hamsterworld.common.web.threadlocal.EntityChangeContextHolder
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component

@Component
class AuditRelayImpl(
    private val objectMapper: ObjectMapper,
    private val applicationEventPublisher: ApplicationEventPublisher
) : AuditRelay {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun postLoad(entity: AuditableTarget) {
        try {
            val entityKey = generateEntityKey(entity)
            val json = objectMapper.writeValueAsString(entity)
            EntityChangeContextHolder.setOriginalJson(entityKey, json)
        } catch (e: Exception) {
            log.error("postLoad 실패 - entity: {}, message: {}", entity.javaClass.simpleName, e.message, e)
        }
    }

    override fun postPersist(entity: AuditableTarget) {
        try {
            val afterJson = objectMapper.writeValueAsString(entity)
            logAuditEvent(entity, "CREATE", null, afterJson)
        } catch (e: Exception) {
            log.error("postPersist 실패 - entity: {}, message: {}", entity.javaClass.simpleName, e.message, e)
        }
    }

    override fun postUpdate(entity: AuditableTarget) {
        try {
            val entityKey = generateEntityKey(entity)
            val prevJson = EntityChangeContextHolder.getOriginalJson(entityKey)
            val afterJson = objectMapper.writeValueAsString(entity)

            logAuditEvent(entity, "UPDATE", prevJson, afterJson)
            EntityChangeContextHolder.setOriginalJson(entityKey, afterJson)
        } catch (e: Exception) {
            log.error("postUpdate 실패 - entity: {}, message: {}", entity.javaClass.simpleName, e.message, e)
        }
    }

    override fun postRemove(entity: AuditableTarget) {
        try {
            val entityKey = generateEntityKey(entity)
            var prevJson = EntityChangeContextHolder.getOriginalJson(entityKey)
            if (prevJson == null) {
                prevJson = objectMapper.writeValueAsString(entity)
            }
            logAuditEvent(entity, "DELETE", prevJson, null)
        } catch (e: Exception) {
            log.error("postRemove 실패 - entity: {}, message: {}", entity.javaClass.simpleName, e.message, e)
        }
    }

    private fun logAuditEvent(entity: AuditableTarget, operation: String, prevJson: String?, afterJson: String?) {
        try {
            val context = AuditContextHolder.getContext()

            val auditLog = AuditLog(
                traceId = context?.traceId ?: "unknown",
                targetId = entity.entityId().toLongOrNull() ?: 0,  // publicId를 Long으로 변환 시도
                targetType = entity.entityType(),
                operation = operation,
                prev = prevJson,
                after = afterJson,
                userId = context?.userId,
                userLoginId = context?.userLoginId,
                userName = context?.userName
            )

            applicationEventPublisher.publishEvent(auditLog)
        } catch (e: Exception) {
            log.error("감사 로그 전송 실패 - entity: {}, message: {}", entity.entityType(), e.message, e)
        }
    }

    private fun generateEntityKey(entity: AuditableTarget): String {
        return "${entity.javaClass.simpleName}_${entity.entityId()}"
    }
}
