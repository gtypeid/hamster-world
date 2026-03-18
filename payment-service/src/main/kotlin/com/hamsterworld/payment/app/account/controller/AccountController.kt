package com.hamsterworld.payment.app.account.controller

import com.hamsterworld.payment.app.account.response.AccountDetailResponse
import com.hamsterworld.payment.app.account.response.AccountResponse
import com.hamsterworld.payment.domain.account.dto.AccountSearchRequest
import com.hamsterworld.payment.domain.account.service.AccountService
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val accountService: AccountService
) {

    @GetMapping("/list")
    fun getAccountList(
        request: AccountSearchRequest
    ): ResponseEntity<List<AccountResponse>> {
        return ResponseEntity.ok(accountService.searchAccountResponses(request))
    }

    @GetMapping("/page")
    fun getAccountPage(
        request: AccountSearchRequest
    ): ResponseEntity<Page<AccountResponse>> {
        return ResponseEntity.ok(accountService.searchAccountResponsePage(request))
    }

    @GetMapping("/{publicId}")
    fun getAccountDetail(
        @PathVariable publicId: String
    ): ResponseEntity<AccountDetailResponse> {
        return ResponseEntity.ok(accountService.findAccountDetailResponseByPublicId(publicId))
    }

    @GetMapping("/user/{userPublicId}")
    fun getAccountsByUser(
        @PathVariable userPublicId: String
    ): ResponseEntity<List<AccountResponse>> {
        return ResponseEntity.ok(accountService.findAccountResponsesByUserPublicId(userPublicId))
    }
}
