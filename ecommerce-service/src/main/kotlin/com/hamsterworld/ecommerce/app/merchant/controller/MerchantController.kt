package com.hamsterworld.ecommerce.app.merchant.controller

import com.hamsterworld.ecommerce.app.merchant.request.MerchantCreateRequest
import com.hamsterworld.ecommerce.app.merchant.request.MerchantUpdateRequest
import com.hamsterworld.ecommerce.app.merchant.response.MerchantResponse
import com.hamsterworld.ecommerce.domain.merchant.service.MerchantService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/merchants")
@Tag(name = "머천트 (Protected)", description = "머천트 관리 Protected API")
class MerchantController(
    private val merchantService: MerchantService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(summary = "머천트 등록", description = "판매자 신청 (사업자 정보, 스토어 정보, 정산 정보 입력)")
    @PostMapping
    fun createMerchant(
        @AuthenticationPrincipal user: User,
        @RequestBody request: MerchantCreateRequest
    ): ResponseEntity<MerchantResponse> {

        log.info(
            "[머천트 등록 요청] userId={}, storeName={}, businessNumber={}",
            user.id, request.storeName, request.businessNumber
        )

        val merchant = merchantService.createMerchant(
            userId = user.id!!,
            businessInfo = request.toBusinessInfo(),
            storeInfo = request.toStoreInfo(),
            settlementInfo = request.toSettlementInfo()
        )

        val response = MerchantResponse.from(merchant, user.publicId)

        log.info(
            "[머천트 등록 완료] merchantPublicId={}, userPublicId={}, storeName={}",
            response.merchantPublicId, response.userPublicId, response.storeName
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "내 머천트 정보 조회", description = "로그인한 사용자의 머천트 정보 조회")
    @GetMapping("/me")
    fun getMyMerchant(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<MerchantResponse> {
        log.info("[내 머천트 조회 요청] userId={}", user.id)

        val merchant = merchantService.findByUserId(user.id!!)
            ?: return ResponseEntity.notFound().build()

        val response = MerchantResponse.from(merchant, user.publicId)

        log.info("[내 머천트 조회 완료] merchantPublicId={}, storeName={}", response.merchantPublicId, response.storeName)

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "머천트 정보 수정", description = "사업자 정보, 스토어 정보, 정산 정보 수정")
    @PutMapping("/{merchantId}")
    fun updateMerchant(
        @AuthenticationPrincipal user: User,
        @PathVariable merchantId: String,
        @RequestBody request: MerchantUpdateRequest
    ): ResponseEntity<MerchantResponse> {
        log.info("[머천트 수정 요청] userId={}, merchantId={}", user.id, merchantId)

        val existingMerchant = merchantService.findByPublicId(merchantId)

        // 권한 체크: 본인의 Merchant만 수정 가능
        if (existingMerchant.userId != user.id) {
            log.warn("[권한 없음] userId={}, merchantUserId={}", user.id, existingMerchant.userId)
            return ResponseEntity.status(403).build()
        }

        // 업데이트할 정보 준비
        val businessInfo = if (request.hasBusinessInfoUpdate()) {
            request.toBusinessInfo(existingMerchant.businessInfo)
        } else null

        val storeInfo = if (request.hasStoreInfoUpdate()) {
            request.toStoreInfo(existingMerchant.storeInfo)
        } else null

        val settlementInfo = if (request.hasSettlementInfoUpdate()) {
            request.toSettlementInfo(existingMerchant.settlementInfo)
        } else null

        val updatedMerchant = merchantService.updateMerchant(
            merchantId = existingMerchant.id!!,
            businessInfo = businessInfo,
            storeInfo = storeInfo,
            settlementInfo = settlementInfo
        )

        val response = MerchantResponse.from(updatedMerchant, user.publicId)

        log.info("[머천트 수정 완료] merchantPublicId={}, storeName={}", response.merchantPublicId, response.storeName)

        return ResponseEntity.ok(response)
    }
}
