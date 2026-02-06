package com.hamsterworld.common.domain.domainlog.handler

import com.hamsterworld.common.domain.domainlog.domain.DomainLog
import com.hamsterworld.common.domain.domainlog.repository.DomainLogRepository
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class DomainLogEventHandler(
    private val domainLogRepository: DomainLogRepository
) {
    @EventListener
    fun handle(entity: DomainLog) {
        domainLogRepository.save(entity)
    }
}
