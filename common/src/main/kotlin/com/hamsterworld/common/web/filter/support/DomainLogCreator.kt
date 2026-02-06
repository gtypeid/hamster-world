package com.hamsterworld.common.web.filter.support

import com.hamsterworld.common.domain.domainlog.domain.DomainLog
import org.springframework.stereotype.Component
import org.springframework.web.util.ContentCachingRequestWrapper
import org.springframework.web.util.ContentCachingResponseWrapper

@Component
class DomainLogCreator(
    private val clientIpResolver: ClientIpResolver,
    private val requestBodyExtractor: RequestBodyExtractor,
    private val responseBodyExtractor: ResponseBodyExtractor
) {
    fun create(
        request: ContentCachingRequestWrapper,
        response: ContentCachingResponseWrapper,
        traceId: String,
        result: ProcessingResult
    ): DomainLog {
        val ip = clientIpResolver.resolve(request)
        val requestBody = requestBodyExtractor.extract(request)
        val responseBody = responseBodyExtractor.extract(response)

        return DomainLog(
            traceId = traceId,
            ip = ip,
            userAgent = request.getHeader("User-Agent") ?: "",
            uri = request.requestURI,
            method = request.method,
            parameters = request.queryString,
            requestBody = requestBody,
            responseBody = responseBody,
            responseStatus = result.responseStatus,
            processingResult = result.result,
            errorMessage = result.errorMessage
        )
    }
}
