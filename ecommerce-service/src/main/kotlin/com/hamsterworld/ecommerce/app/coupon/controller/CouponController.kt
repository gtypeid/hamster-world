package com.hamsterworld.ecommerce.app.coupon.controller

import com.hamsterworld.ecommerce.app.coupon.dto.CouponPolicyDto
import com.hamsterworld.ecommerce.app.coupon.dto.CouponUsageDto
import com.hamsterworld.ecommerce.app.coupon.dto.UserCouponDto
import com.hamsterworld.ecommerce.app.coupon.request.UserCouponSearchRequest
import com.hamsterworld.ecommerce.app.coupon.service.CouponService
import com.hamsterworld.ecommerce.app.coupon.service.UserCouponService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

/**
 * Coupon Controller (User API)
 *
 * 일반 사용자용 쿠폰 API
 *
 * ## 쿠폰 플로우
 * 1. 쿠폰 정책 조회 (GET /{couponCode})
 * 2. 쿠폰 수령 (POST /{couponCode}/claim)
 * 3. 내 쿠폰함 조회 (GET /my-coupons/list, /my-coupons/page)
 * 4. 쿠폰 사용 → 주문 생성 시 자동 처리 (OrderService)
 * 5. 내 쿠폰 사용 내역 (GET /my-usages/list)
 */
@Tag(name = "쿠폰")
@RestController
@RequestMapping("/coupons")
class CouponController(
    private val couponService: CouponService,
    private val userCouponService: UserCouponService
) {

    @Operation(summary = "쿠폰 정책 조회", description = "쿠폰 코드로 쿠폰 정책을 조회합니다")
    @GetMapping("/{couponCode}")
    fun getCouponPolicy(
        @PathVariable couponCode: String
    ): ResponseEntity<CouponPolicyDto> {
        return ResponseEntity.ok(couponService.getCouponPolicy(couponCode))
    }

    @Operation(summary = "쿠폰 수령", description = "쿠폰 코드를 입력하여 쿠폰을 수령합니다")
    @PostMapping("/{couponCode}/claim")
    fun claimCoupon(
        @AuthenticationPrincipal user: User,
        @PathVariable couponCode: String
    ): ResponseEntity<UserCouponDto> {
        return ResponseEntity.ok(userCouponService.claimCoupon(user.id!!, couponCode))
    }

    @Operation(
        summary = "내 쿠폰함 목록 조회",
        description = """
            수령한 쿠폰 목록을 조회합니다.
            - status: 상태 필터 (AVAILABLE, USED, EXPIRED)
            - productPublicIds: 장바구니 상품 기반 필터링 (쉼표 구분)
            - from/to: 발급일 범위 필터 (yyyy-MM-dd)
        """
    )
    @GetMapping("/my-coupons/list")
    fun getMyCouponsList(
        @AuthenticationPrincipal user: User,
        @ModelAttribute searchRequest: UserCouponSearchRequest
    ): ResponseEntity<List<UserCouponDto>> {
        return ResponseEntity.ok(userCouponService.searchMyCoupons(user.id!!, searchRequest))
    }

    @Operation(
        summary = "내 쿠폰함 페이지 조회",
        description = """
            수령한 쿠폰 목록을 페이징하여 조회합니다.
            - status: 상태 필터 (AVAILABLE, USED, EXPIRED)
            - productPublicIds: 장바구니 상품 기반 필터링 (쉼표 구분)
            - from/to: 발급일 범위 필터 (yyyy-MM-dd)
            - page/size: 페이징
        """
    )
    @GetMapping("/my-coupons/page")
    fun getMyCouponsPage(
        @AuthenticationPrincipal user: User,
        @ModelAttribute searchRequest: UserCouponSearchRequest
    ): ResponseEntity<Page<UserCouponDto>> {
        return ResponseEntity.ok(userCouponService.searchMyCouponsPage(user.id!!, searchRequest))
    }

    @Operation(summary = "내 쿠폰 사용 내역 조회", description = "사용자의 쿠폰 사용 내역을 조회합니다")
    @GetMapping("/my-usages/list")
    fun getMyCouponUsagesList(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<List<CouponUsageDto>> {
        return ResponseEntity.ok(couponService.getUserCouponUsages(user.id!!))
    }
}
