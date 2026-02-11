package com.hamsterworld.ecommerce.app.account.controller

import com.hamsterworld.ecommerce.app.account.response.MyAccountResponse
import com.hamsterworld.ecommerce.domain.account.service.AccountService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Account API Controller
 *
 * 사용자 본인의 잔액(포인트) 조회 API
 * 역할(Role)에 따라 노출되는 잔액 범위가 다름
 */
@Tag(name = "계좌")
@RequestMapping("/api/accounts")
@RestController
class AccountController(
    private val accountService: AccountService
) {

    /**
     * 내 잔액 조회
     *
     * GET /api/accounts/me
     *
     * 역할별 노출 범위:
     * - USER: consumerBalance (포인트)
     * - MERCHANT: consumerBalance + merchantBalance
     * - ADMIN 이상: 전체
     */
    @Operation(summary = "내 잔액 조회")
    @GetMapping("/me")
    fun getMyAccount(
        @AuthenticationPrincipal user: User
    ): ResponseEntity<MyAccountResponse> {
        return ResponseEntity.ok(accountService.getMyAccountResponse(user.id!!, user.role))
    }
}
