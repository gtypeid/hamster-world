package com.hamsterworld.ecommerce.web.resolver

/**
 * Controller 메서드 파라미터에서 인증된 머천트를 주입받기 위한 어노테이션
 *
 * @CurrentUser로 User를 먼저 가져온 후, 해당 User의 Merchant를 조회합니다.
 * Merchant가 없으면 예외를 발생시킵니다.
 *
 * @see MerchantArgumentResolver
 */
@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuthenticatedMerchant
