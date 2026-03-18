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
        if (authentication is UsernamePasswordAuthenticationToken) {
            val user = authentication.principal as? User
                ?: throw CustomRuntimeException("인증된 사용자 정보를 찾을 수 없습니다")
            val merchant = merchantRepository.findByUserIdOrThrow(user.id!!)
            return merchant
        }
        throw CustomRuntimeException("인증 정보가 올바르지 않습니다")
    }
}
