package com.hamsterworld.ecommerce.web.resolver

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.ecommerce.domain.user.model.User
import org.springframework.core.MethodParameter
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

/**
 * @AuthenticatedMerchant 어노테이션이 붙은 파라미터에 현재 인증된 머천트를 주입합니다.
 *
 * 1. SecurityContext에서 User를 가져옵니다 (JwtUserSyncFilter에서 설정됨)
 * 2. User의 ID로 Merchant를 조회합니다
 * 3. Merchant가 없으면 예외를 발생시킵니다
 */
@Component
class MerchantArgumentResolver(
    private val merchantRepository: MerchantRepository
) : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean {
        return parameter.hasParameterAnnotation(AuthenticatedMerchant::class.java) &&
                parameter.parameterType == Merchant::class.java
    }

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): Merchant {
        val authentication = SecurityContextHolder.getContext().authentication

        // JwtUserSyncFilter에서 User를 Principal로 설정했으므로 가져옴
        if (authentication is UsernamePasswordAuthenticationToken) {
            val user = authentication.principal as? User
                ?: throw CustomRuntimeException("인증된 사용자 정보를 찾을 수 없습니다")

            // User의 Merchant 조회
            val merchant = merchantRepository.findByUserIdOrThrow(user.id!!)
            return merchant
        }

        throw CustomRuntimeException("인증 정보가 올바르지 않습니다")
    }
}
