package com.hamsterworld.common.web.exception

import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.InvalidDataAccessResourceUsageException
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.orm.jpa.JpaSystemException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import org.springframework.web.multipart.MultipartException
import java.nio.file.AccessDeniedException
import java.sql.SQLException
import java.sql.SQLIntegrityConstraintViolationException
import java.time.LocalDateTime

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationExceptions(
        ex: MethodArgumentNotValidException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {

        val errorMessage = ex.bindingResult.fieldErrors.joinToString(", ") {
            "${it.field}: ${it.defaultMessage}"
        }

        val errorResponse = ErrorResponse(
            status = 400,
            error = "Bad Request",
            message = errorMessage,
            path = getPath(request),
            timestamp = LocalDateTime.now()
        )

        return ResponseEntity.badRequest().body(errorResponse)
    }

    @ExceptionHandler(Exception::class)
    fun handleAllExceptions(ex: Exception, request: WebRequest): ResponseEntity<ErrorResponse> {
        log.error("예외 발생: {}", ex.javaClass.simpleName, ex)

        val status = mapToHttpStatus(ex)
        val message = resolveErrorMessage(ex, status)

        val errorResponse = ErrorResponse(
            status = status.code,
            error = status.reason,
            message = message,
            path = getPath(request),
            timestamp = LocalDateTime.now()
        )

        return ResponseEntity.status(status.code).body(errorResponse)
    }

    private fun mapToHttpStatus(ex: Exception): HttpStatusType {
        return when (ex) {
            is CustomRuntimeException, is IllegalStateException, is IllegalArgumentException,
            is MultipartException, is HttpMessageNotReadableException -> HttpStatusType.BAD_REQUEST
            is NoSuchElementException -> HttpStatusType.NOT_FOUND
            is HttpMediaTypeNotSupportedException -> HttpStatusType.UNSUPPORTED_MEDIA_TYPE
            is AccessDeniedException -> HttpStatusType.FORBIDDEN
            is SQLException, is JpaSystemException, is DataIntegrityViolationException,
            is InvalidDataAccessResourceUsageException -> HttpStatusType.INTERNAL_SERVER_ERROR
            else -> HttpStatusType.INTERNAL_SERVER_ERROR
        }
    }

    private fun resolveErrorMessage(ex: Exception, status: HttpStatusType): String {
        if (ex is CustomRuntimeException) {
            return ex.message ?: "서버에서 오류가 발생했습니다."
        }

        if (ex is DataIntegrityViolationException || ex is InvalidDataAccessResourceUsageException ||
            ex is SQLIntegrityConstraintViolationException) {
            return "데이터 무결성 에러가 발생했습니다."
        }

        return when (status) {
            HttpStatusType.BAD_REQUEST -> {
                when (ex) {
                    is MultipartException -> "파일 업로드 형식이 올바르지 않습니다. multipart/form-data를 사용해주세요."
                    is HttpMessageNotReadableException -> "요청 본문(JSON)을 읽을 수 없습니다. 입력 형식을 확인해주세요."
                    else -> "잘못된 요청입니다."
                }
            }
            HttpStatusType.FORBIDDEN -> "접근 권한이 없습니다."
            HttpStatusType.NOT_FOUND -> "요청한 리소스를 찾을 수 없습니다."
            HttpStatusType.PAYLOAD_TOO_LARGE -> "업로드 파일 크기가 너무 큽니다."
            HttpStatusType.UNSUPPORTED_MEDIA_TYPE -> "지원하지 않는 미디어 타입입니다."
            else -> "서버에서 오류가 발생했습니다."
        }
    }

    private fun getPath(request: WebRequest): String {
        return request.getDescription(false).replace("uri=", "")
    }
}
