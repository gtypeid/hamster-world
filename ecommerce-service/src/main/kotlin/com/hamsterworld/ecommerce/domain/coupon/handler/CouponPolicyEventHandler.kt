package com.hamsterworld.ecommerce.domain.coupon.handler

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.hamsterworld.ecommerce.domain.coupon.event.InternalCouponPolicyCreatedEvent
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicyProduct
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyProductRepository
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Coupon Policy Event Handler
 *
 * CouponPolicy 생성 시 발행되는 내부 이벤트를 처리합니다.
 *
 * ## 처리 내용
 * - conditionFiltersJson에서 productIds (Public ID) 파싱
 * - Product Public ID → Internal ID 변환
 * - CouponPolicyProduct 하위 엔티티 일괄 생성
 *
 * ## 트랜잭션
 * - @EventListener (동기) + Propagation.MANDATORY → CouponPolicy 저장과 같은 트랜잭션
 * - CouponPolicyProduct 생성 실패 시 CouponPolicy 저장도 롤백
 */
@Component
class CouponPolicyEventHandler(
    private val couponPolicyProductRepository: CouponPolicyProductRepository,
    private val productRepository: ProductRepository
) {

    private val log = LoggerFactory.getLogger(CouponPolicyEventHandler::class.java)
    private val objectMapper = jacksonObjectMapper()

    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    fun handle(event: InternalCouponPolicyCreatedEvent) {
        val couponPolicy = event.couponPolicy
        val filtersJson = couponPolicy.usageCondition.filtersJson

        log.info(
            "[쿠폰 정책 생성 이벤트] couponPolicyId={}, couponCode={}, filtersJson={}",
            couponPolicy.id, couponPolicy.couponCode, filtersJson
        )

        // filtersJson이 없거나 비어있으면 하위 엔티티 생성 불필요
        if (filtersJson.isNullOrBlank() || filtersJson == "{}") {
            log.info("[쿠폰 정책 생성 이벤트] productIds 없음 — 하위 엔티티 생성 스킵")
            return
        }

        // JSON 파싱
        val filters = try {
            objectMapper.readValue(filtersJson, Map::class.java)
        } catch (e: Exception) {
            log.warn("[쿠폰 정책 생성 이벤트] filtersJson 파싱 실패: {}", e.message)
            return
        }

        // productIds 추출 (Public ID 문자열 배열)
        val rawProductIds = filters["productIds"] as? List<*> ?: return
        val productPublicIds = rawProductIds.filterIsInstance<String>()

        if (productPublicIds.isEmpty()) {
            log.info("[쿠폰 정책 생성 이벤트] productIds 비어있음 — 하위 엔티티 생성 스킵")
            return
        }

        // Public ID → Internal ID 변환
        val products = productRepository.findByPublicIds(productPublicIds)

        if (products.size != productPublicIds.size) {
            val foundPublicIds = products.map { it.publicId }.toSet()
            val missing = productPublicIds.filter { it !in foundPublicIds }
            log.warn(
                "[쿠폰 정책 생성 이벤트] 존재하지 않는 상품 Public ID: {}",
                missing
            )
        }

        if (products.isEmpty()) {
            log.warn("[쿠폰 정책 생성 이벤트] 유효한 상품 없음 — 하위 엔티티 생성 스킵")
            return
        }

        // CouponPolicyProduct 일괄 생성
        val couponPolicyProducts = products.map { product ->
            CouponPolicyProduct.create(
                couponPolicyId = couponPolicy.id!!,
                productId = product.id!!
            )
        }

        val saved = couponPolicyProductRepository.saveAll(couponPolicyProducts)

        log.info(
            "[쿠폰 정책 생성 이벤트] CouponPolicyProduct {}개 생성 완료. couponPolicyId={}, productIds={}",
            saved.size, couponPolicy.id, products.map { it.id }
        )
    }
}
