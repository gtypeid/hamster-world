package com.hamsterworld.ecommerce.app.merchant.controller

import com.hamsterworld.ecommerce.app.merchant.response.MerchantSellerInfoResponse
import com.hamsterworld.ecommerce.domain.merchant.service.MerchantService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Merchant Public API (비로그인 사용자 접근 가능)
 *
 * ## 책임
 * - 판매자 공개 정보 조회
 * - JWT 인증 불필요 (Public API)
 *
 * ## 엔드포인트
 * - GET /api/public/merchants/{merchantId} → 판매자 공개 정보 조회 (민감정보 제외)
 */
@RestController
@RequestMapping("/api/public/merchants")
@Tag(name = "판매자 (Public)", description = "판매자 Public API")
class MerchantPublicController(
    private val merchantService: MerchantService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(
        summary = "판매자 공개 정보 조회",
        description = "비로그인 사용자도 접근 가능한 판매자 공개 정보 조회 (민감정보 제외)"
    )
    @GetMapping("/{merchantId}")
    fun getMerchantSellerInfo(
        @PathVariable merchantId: String
    ): ResponseEntity<MerchantSellerInfoResponse> {
        log.info("[판매자 공개 정보 조회 요청] merchantId={}", merchantId)

        val merchant = merchantService.findByPublicId(merchantId)
        val response = MerchantSellerInfoResponse.from(merchant)

        log.info("[판매자 공개 정보 조회 완료] merchantPublicId={}, storeName={}", response.merchantPublicId, response.storeName)

        return ResponseEntity.ok(response)
    }
}
