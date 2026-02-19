package com.hamsterworld.cashgateway.app.payment.service

import com.hamsterworld.cashgateway.app.payment.dto.CashGatewayResponse
import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.domain.cashgatewaymid.model.CashGatewayMid
import com.hamsterworld.cashgateway.domain.cashgatewaymid.repository.CashGatewayMidRepository
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClient
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayProvider
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentService(
    private val paymentGatewayClient: PaymentGatewayClient,
    private val cashGatewayMidRepository: CashGatewayMidRepository,
    private val paymentGatewayProviders: List<PaymentGatewayProvider>
) {
    private val log = LoggerFactory.getLogger(PaymentService::class.java)

    /**
     * Provider에 해당하는 PaymentGatewayProvider 조회
     */
    private fun getProvider(provider: Provider): PaymentGatewayProvider {
        return paymentGatewayProviders.first { it.getProvider() == provider }
    }

    /**
     * 내부 결제 승인 요청 (ecommerce -> cash-gateway -> PG)
     *
     * ## MID 조회 정책 (Get-or-Create)
     * - 외부 서비스가 Cash Gateway MID를 직접 지정하지 않음
     * - Cash Gateway가 userKeycloakId + provider 기반으로 CashGatewayMid를 자체 조회
     * - 존재하지 않으면 Provider의 기본 PG MID로 CashGatewayMid를 자동 생성
     * - 조회/생성된 CashGatewayMid.mid를 ctx.cashGatewayMid로 전달
     *
     * ## 플로우
     * 1. userKeycloakId로 CashGatewayMid 조회 (없으면 자동 생성)
     * 2. PaymentGatewayClient를 통해 PG 요청
     * 3. PaymentProcess 생성 (UNKNOWN 상태)
     * 4. Webhook으로 최종 결과 수신 예정
     *
     * **트랜잭션 전파 정책**:
     * - `MANDATORY`: 반드시 부모 트랜잭션 내에서 호출되어야 함
     * - 호출 경로: PaymentEventConsumer(MANDATORY) -> approve(MANDATORY) -> payment(MANDATORY) -> handleRequest(MANDATORY)
     * - 목적: Kafka Consumer 트랜잭션과 원자성 보장 (전체 성공 or 전체 롤백)
     *
     * @param request PaymentApproveRequest
     * @return CashGatewayResponse (Webhook 대기 메시지)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun approve(request: PaymentApproveRequest): CashGatewayResponse {
        // userKeycloakId + provider로 CashGatewayMid 조회, 없으면 자동 생성
        val cashGatewayMid = findOrCreateCashGatewayMid(request.provider, request.userKeycloakId)

        log.info("[CashGatewayMid 조회 완료] provider={}, userKeycloakId={}, cashGatewayMid={}, pgMid={}, originSource={}",
            request.provider, request.userKeycloakId, cashGatewayMid.mid, cashGatewayMid.pgMid, cashGatewayMid.originSource)

        val ctx = ApprovePaymentCtx(
            userKeycloakId = request.userKeycloakId,
            orderPublicId = request.orderPublicId,
            orderNumber = request.orderNumber,
            amount = request.amount,
            cashGatewayMid = cashGatewayMid.mid  // Cash Gateway가 결정한 MID
        )

        // PG 요청 (무조건 null 반환 - Webhook 대기)
        paymentGatewayClient.bind(request.provider).payment(ctx)

        log.info("[PG 요청 완료] orderPublicId={}, provider={}, cashGatewayMid={}",
            request.orderPublicId, request.provider, cashGatewayMid.mid)

        return CashGatewayResponse(
            success = true,
            message = "PG 요청 완료 - Webhook으로 최종 결과 수신 예정",
            orderPublicId = request.orderPublicId
        )
    }

    /**
     * CashGatewayMid 조회 또는 자동 생성 (Get-or-Create)
     *
     * 1. provider + userKeycloakId로 기존 CashGatewayMid 조회
     * 2. 존재하면 그대로 반환
     * 3. 존재하지 않으면 Provider의 기본 PG MID로 새 CashGatewayMid 생성 후 저장
     *
     * @param provider PG사
     * @param userKeycloakId 유저의 Keycloak Subject ID
     * @return 조회/생성된 CashGatewayMid
     */
    private fun findOrCreateCashGatewayMid(provider: Provider, userKeycloakId: String): CashGatewayMid {
        val existing = cashGatewayMidRepository.findByProviderAndUserKeycloakId(provider, userKeycloakId)
        if (existing != null) return existing

        val gatewayProvider = getProvider(provider)
        val defaultPgMid = gatewayProvider.getDefaultPgMid()

        val newMid = CashGatewayMid.create(
            provider = provider,
            pgMid = defaultPgMid,
            userKeycloakId = userKeycloakId
        )

        val saved = cashGatewayMidRepository.save(newMid)

        log.info("[CashGatewayMid 자동 생성] provider={}, userKeycloakId={}, mid={}, pgMid={}",
            provider, userKeycloakId, saved.mid, saved.pgMid)

        return saved
    }

    /**
     * 외부 결제 등록 (외부 서비스 -> cash-gateway)
     *
     * TODO: 향후 구현 필요 시 Payment Service로 이벤트 발행하여 처리
     * - Payment entity는 Payment Service에서만 관리
     * - Cash Gateway는 PaymentProcess만 생성하고 이벤트 발행
     */
}
