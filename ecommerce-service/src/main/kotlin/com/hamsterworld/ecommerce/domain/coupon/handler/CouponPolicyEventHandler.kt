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
        if (filtersJson.isNullOrBlank() || filtersJson == "{}") {
            log.info("[쿠폰 정책 생성 이벤트] productIds 없음 — 하위 엔티티 생성 스킵")
            return
        }
        val filters = try {
            objectMapper.readValue(filtersJson, Map::class.java)
        } catch (e: Exception) {
            log.warn("[쿠폰 정책 생성 이벤트] filtersJson 파싱 실패: {}", e.message)
            return
        }
        val rawProductIds = filters["productIds"] as? List<*> ?: return
        val productPublicIds = rawProductIds.filterIsInstance<String>()
        if (productPublicIds.isEmpty()) {
            log.info("[쿠폰 정책 생성 이벤트] productIds 비어있음 — 하위 엔티티 생성 스킵")
            return
        }
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
