package com.hamsterworld.ecommerce.app.coupon.controller

import com.hamsterworld.ecommerce.app.coupon.dto.CouponPolicyDto
import com.hamsterworld.ecommerce.app.coupon.request.CreateCouponPolicyRequest
import com.hamsterworld.ecommerce.app.coupon.service.CouponService
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponIssuerType
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.web.resolver.AuthenticatedMerchant
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Coupon Merchant Controller
 *
 * 판매자(Merchant) 전용 쿠폰 관리 API
 *
 * ## 접근 권한
 * - @AuthenticatedMerchant 사용 → Merchant 등록된 User만 접근 가능
 * - MerchantArgumentResolver에서 자동으로 권한 체크
 * - Merchant가 아닌 User 접근 시 예외 발생
 *
 * ## MERCHANT 쿠폰
 * - 판매자가 자신의 상품에 대해 발급하는 쿠폰
 * - 해당 판매자 상품에만 적용 가능
 */
@Tag(name = "쿠폰 판매자")
@RestController
@RequestMapping("/merchant/coupons")
class CouponMerchantController(
    private val couponService: CouponService
) {

    @Operation(
        summary = "판매자 쿠폰 생성",
        description = "판매자가 자신의 상품에 대한 쿠폰을 생성합니다"
    )
    @PostMapping
    fun createMerchantCoupon(
        @AuthenticatedMerchant merchant: Merchant,
        @RequestBody request: CreateCouponPolicyRequest
    ): ResponseEntity<CouponPolicyDto> {
        val couponPolicy = couponService.createCouponPolicy(
            issuerType = CouponIssuerType.MERCHANT,
            merchant = merchant,
            request = request
        )
        return ResponseEntity.ok(couponPolicy)
    }

    @Operation(
        summary = "내 쿠폰 목록 조회",
        description = "판매자가 자신이 생성한 쿠폰 목록을 조회합니다"
    )
    @GetMapping("/my-coupons/list")
    fun getMyCouponsList(
        @AuthenticatedMerchant merchant: Merchant
    ): ResponseEntity<List<CouponPolicyDto>> {
        val coupons = couponService.getMerchantCoupons(merchant)
        return ResponseEntity.ok(coupons)
    }
}
