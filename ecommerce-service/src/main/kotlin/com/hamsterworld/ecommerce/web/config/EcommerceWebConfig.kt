package com.hamsterworld.ecommerce.web.config

import com.hamsterworld.ecommerce.web.resolver.MerchantArgumentResolver
import org.springframework.context.annotation.Configuration
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class EcommerceWebConfig(
    private val merchantArgumentResolver: MerchantArgumentResolver
) : WebMvcConfigurer {

    override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
        resolvers.add(merchantArgumentResolver)
    }
}
