package com.hamsterworld.ecommerce.app.coupon.controller

import com.hamsterworld.ecommerce.app.coupon.dto.CouponPolicyDto
import com.hamsterworld.ecommerce.app.coupon.request.CreateCouponPolicyRequest
import com.hamsterworld.ecommerce.app.coupon.service.CouponService
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponIssuerType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Coupon Admin Controller
 *
 * 관리자용 플랫폼 쿠폰 관리 API
 *
 * ## PLATFORM 쿠폰
 * - Hamster World가 발급하는 쿠폰
 * - 모든 판매자 상품에 적용 가능
 */
@Tag(name = "쿠폰 관리자")
@RestController
@RequestMapping("/api/admin/coupons")
class CouponAdminController(
    private val couponService: CouponService
) {

    @Operation(
        summary = "플랫폼 쿠폰 생성",
        description = "관리자가 플랫폼 쿠폰을 생성합니다 (모든 판매자 상품에 적용 가능)"
    )
    @PostMapping("/platform")
    fun createPlatformCoupon(
        @RequestBody request: CreateCouponPolicyRequest
    ): ResponseEntity<CouponPolicyDto> {
        val couponPolicy = couponService.createCouponPolicy(
            issuerType = CouponIssuerType.PLATFORM,
            merchant = null,
            request = request
        )
        return ResponseEntity.ok(couponPolicy)
    }

    @Operation(summary = "쿠폰 정책 조회 (Public ID)", description = "Public ID로 쿠폰 정책을 조회합니다")
    @GetMapping("/{publicId}")
    fun getCouponPolicyByPublicId(
        @PathVariable publicId: String
    ): ResponseEntity<CouponPolicyDto> {
        val couponPolicy = couponService.getCouponPolicyByPublicId(publicId)
        return ResponseEntity.ok(couponPolicy)
    }

    @Operation(summary = "쿠폰 정책 비활성화", description = "쿠폰 코드로 쿠폰을 비활성화합니다")
    @PostMapping("/{couponCode}/deactivate")
    fun deactivateCouponPolicy(
        @PathVariable couponCode: String
    ): ResponseEntity<CouponPolicyDto> {
        val couponPolicy = couponService.deactivateCouponPolicy(couponCode)
        return ResponseEntity.ok(couponPolicy)
    }

    @Operation(summary = "쿠폰 정책 활성화", description = "쿠폰 코드로 쿠폰을 활성화합니다")
    @PostMapping("/{couponCode}/activate")
    fun activateCouponPolicy(
        @PathVariable couponCode: String
    ): ResponseEntity<CouponPolicyDto> {
        val couponPolicy = couponService.activateCouponPolicy(couponCode)
        return ResponseEntity.ok(couponPolicy)
    }
}
