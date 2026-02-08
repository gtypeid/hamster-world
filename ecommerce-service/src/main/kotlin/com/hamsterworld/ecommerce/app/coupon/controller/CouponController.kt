package com.hamsterworld.ecommerce.app.coupon.controller

import com.hamsterworld.ecommerce.app.coupon.dto.CouponPolicyDto
import com.hamsterworld.ecommerce.app.coupon.dto.CouponUsageDto
import com.hamsterworld.ecommerce.app.coupon.service.CouponService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

/**
 * Coupon Controller (User API)
 *
 * 일반 사용자용 쿠폰 API
 *
 * ## 쿠폰 적용
 * - 쿠폰은 주문 생성 시 함께 적용됩니다 (OrderService에서 처리)
 * - 별도 쿠폰 적용 API는 제공하지 않습니다
 */
@Tag(name = "쿠폰")
@RestController
@RequestMapping("/coupons")
class CouponController(
    private val couponService: CouponService
) {

    @Operation(summary = "쿠폰 정책 조회", description = "쿠폰 코드로 쿠폰 정책을 조회합니다")
    @GetMapping("/{couponCode}")
    fun getCouponPolicy(
        @PathVariable couponCode: String
    ): ResponseEntity<CouponPolicyDto> {
        val couponPolicy = couponService.getCouponPolicy(couponCode)
        return ResponseEntity.ok(couponPolicy)
    }

    @Operation(summary = "내 쿠폰 사용 내역 조회", description = "사용자의 쿠폰 사용 내역을 조회합니다")
    @GetMapping("/my-usages/list")
    fun getMyCouponUsagesList(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<List<CouponUsageDto>> {
        val couponUsages = couponService.getUserCouponUsages(user.id!!)
        return ResponseEntity.ok(couponUsages)
    }
}
