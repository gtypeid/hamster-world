package com.hamsterworld.common.web.config
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler
import org.springframework.security.access.hierarchicalroles.RoleHierarchy
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl
@Configuration
class RoleHierarchyConfig {
    @Bean
    fun roleHierarchy(): RoleHierarchy {
        val hierarchyString = """
            ROLE_SYSTEM > ROLE_DEVELOPER
            ROLE_DEVELOPER > ROLE_ADMIN
            ROLE_ADMIN > ROLE_MERCHANT
            ROLE_MERCHANT > ROLE_VENDOR
            ROLE_VENDOR > ROLE_USER
        """.trimIndent()
        return RoleHierarchyImpl.fromHierarchy(hierarchyString)
    }
    @Bean
    fun methodSecurityExpressionHandler(roleHierarchy: RoleHierarchy): MethodSecurityExpressionHandler {
        val expressionHandler = DefaultMethodSecurityExpressionHandler()
        expressionHandler.setRoleHierarchy(roleHierarchy)
        return expressionHandler
    }
}
