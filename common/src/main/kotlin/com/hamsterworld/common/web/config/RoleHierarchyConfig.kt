package com.hamsterworld.common.web.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler
import org.springframework.security.access.hierarchicalroles.RoleHierarchy
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl

/**
 * Spring Security Role Hierarchy 설정
 *
 * 권한 계층 구조:
 * ROLE_SYSTEM > ROLE_DEVELOPER > ROLE_ADMIN > ROLE_MERCHANT > ROLE_VENDOR > ROLE_USER
 *
 * 설정 후:
 * - @PreAuthorize("hasRole('DEVELOPER')")
 *   → DEVELOPER, SYSTEM 모두 접근 가능
 * - @PreAuthorize("hasRole('ADMIN')")
 *   → ADMIN, DEVELOPER, SYSTEM 모두 접근 가능
 */
@Configuration
class RoleHierarchyConfig {

    /**
     * Role Hierarchy 정의
     *
     * 상위 Role은 하위 Role의 모든 권한을 포함합니다.
     */
    @Bean
    fun roleHierarchy(): RoleHierarchy {
        // 권한 계층 구조 정의
        // 형식: "상위 > 하위"
        val hierarchyString = """
            ROLE_SYSTEM > ROLE_DEVELOPER
            ROLE_DEVELOPER > ROLE_ADMIN
            ROLE_ADMIN > ROLE_MERCHANT
            ROLE_MERCHANT > ROLE_VENDOR
            ROLE_VENDOR > ROLE_USER
        """.trimIndent()

        return RoleHierarchyImpl.fromHierarchy(hierarchyString)
    }

    /**
     * Method Security Expression Handler
     *
     * @PreAuthorize 어노테이션에서 Role Hierarchy를 사용하도록 설정
     */
    @Bean
    fun methodSecurityExpressionHandler(roleHierarchy: RoleHierarchy): MethodSecurityExpressionHandler {
        val expressionHandler = DefaultMethodSecurityExpressionHandler()
        expressionHandler.setRoleHierarchy(roleHierarchy)
        return expressionHandler
    }
}
