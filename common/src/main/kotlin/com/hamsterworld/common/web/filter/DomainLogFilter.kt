package com.hamsterworld.common.web.filter

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.common.web.filter.support.DomainLogCreator
import com.hamsterworld.common.web.filter.support.ProcessingResult
import com.hamsterworld.common.web.filter.support.RequestSkipChecker
import com.hamsterworld.common.web.filter.support.ResponseStatusAnalyzer
import com.hamsterworld.common.web.threadlocal.AuditContext
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import com.hamsterworld.common.web.threadlocal.EntityChangeContextHolder
import jakarta.servlet.Filter
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.ServletResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.util.ContentCachingRequestWrapper
import org.springframework.web.util.ContentCachingResponseWrapper
import java.util.UUID

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class DomainLogFilter(
    private val applicationEventPublisher: ApplicationEventPublisher,
    private val requestSkipChecker: RequestSkipChecker,
    private val domainLogCreator: DomainLogCreator,
    private val responseStatusAnalyzer: ResponseStatusAnalyzer
) : Filter {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        val httpRequest = request as HttpServletRequest
        val httpResponse = response as HttpServletResponse

        if (requestSkipChecker.shouldSkip(httpRequest)) {
            chain.doFilter(request, response)
            return
        }

        val wrappedRequest = ContentCachingRequestWrapper(httpRequest)
        val wrappedResponse = ContentCachingResponseWrapper(httpResponse)

        // OpenTelemetry trace ID 사용 (없으면 UUID로 fallback)
        val traceId = TraceContextHolder.getCurrentTraceId() ?: UUID.randomUUID().toString()
        initializeAuditContext(traceId)

        var processingResult: ProcessingResult? = null

        try {
            chain.doFilter(wrappedRequest, wrappedResponse)
            processingResult = responseStatusAnalyzer.analyze(wrappedResponse.status)
        } catch (ex: Exception) {
            log.error("Filter error:", ex)
            processingResult = ProcessingResult.exception(ex.message ?: "Unknown error")
        } finally {
            publishDomainLog(wrappedRequest, wrappedResponse, traceId, processingResult!!)
            clearContexts()
            wrappedResponse.copyBodyToResponse()
        }
    }

    private fun initializeAuditContext(traceId: String) {
        AuditContextHolder.setContext(
            AuditContext(traceId = traceId)
        )
    }

    private fun publishDomainLog(
        request: ContentCachingRequestWrapper,
        response: ContentCachingResponseWrapper,
        traceId: String,
        processingResult: ProcessingResult
    ) {
        val domainLog = domainLogCreator.create(request, response, traceId, processingResult)
        applicationEventPublisher.publishEvent(domainLog)
    }

    private fun clearContexts() {
        AuditContextHolder.clear()
        EntityChangeContextHolder.clear()
    }
}
