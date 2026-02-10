package com.hamsterworld.payment.app.account.controller

import com.hamsterworld.payment.app.account.response.AccountDetailResponse
import com.hamsterworld.payment.app.account.response.AccountRecordResponse
import com.hamsterworld.payment.app.account.response.AccountResponse
import com.hamsterworld.payment.domain.account.dto.AccountSearchRequest
import com.hamsterworld.payment.domain.account.service.AccountService
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Account API Controller
 *
 * Internal Admin용 계좌 조회 API
 */
@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val accountService: AccountService
) {

    /**
     * 계좌 목록 조회 (List)
     *
     * GET /api/accounts/list?userPublicId=...&accountTypes=...&from=...&to=...&sort=...
     */
    @GetMapping("/list")
    fun getAccountList(
        request: AccountSearchRequest
    ): ResponseEntity<List<AccountResponse>> {
        val accounts = accountService.searchAccounts(request)
        val responses = accounts.map { AccountResponse.from(it) }
        return ResponseEntity.ok(responses)
    }

    /**
     * 계좌 목록 조회 (Page)
     *
     * GET /api/accounts/page?page=0&size=20&userPublicId=...&sort=...
     */
    @GetMapping("/page")
    fun getAccountPage(
        request: AccountSearchRequest
    ): ResponseEntity<Page<AccountResponse>> {
        val accountsPage = accountService.searchAccountPage(request)
        val responses = accountsPage.map { AccountResponse.from(it) }
        return ResponseEntity.ok(responses)
    }

    /**
     * 계좌 상세 조회 (Account + AccountRecords)
     *
     * GET /api/accounts/{publicId}
     *
     * @param publicId Account Public ID (Snowflake Base62)
     * @return Account + AccountRecord 목록 (잔액 변동 이력)
     */
    @GetMapping("/{publicId}")
    fun getAccountDetail(
        @PathVariable publicId: String
    ): ResponseEntity<AccountDetailResponse> {
        val detailData = accountService.findAccountDetailByPublicId(publicId)

        val recordResponses = detailData.records.map { record ->
            AccountRecordResponse.from(
                record = record,
                accountPublicId = detailData.account.publicId
            )
        }

        val response = AccountDetailResponse.from(
            account = detailData.account,
            records = recordResponses
        )

        return ResponseEntity.ok(response)
    }

    /**
     * 사용자의 모든 계좌 조회
     *
     * GET /api/accounts/user/{userPublicId}
     */
    @GetMapping("/user/{userPublicId}")
    fun getAccountsByUser(
        @PathVariable userPublicId: String
    ): ResponseEntity<List<AccountResponse>> {
        val accounts = accountService.findAccountsByUserPublicId(userPublicId)
        val responses = accounts.map { AccountResponse.from(it) }
        return ResponseEntity.ok(responses)
    }
}
