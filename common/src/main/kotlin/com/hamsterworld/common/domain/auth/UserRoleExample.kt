package com.hamsterworld.common.domain.auth

/**
 * UserRole 사용 예시
 *
 * 이 파일은 문서화 목적이며, 실제 코드에서는 삭제해도 됩니다.
 */
object UserRoleExample {

    /**
     * 예시 1: 권한 레벨 비교
     */
    fun example1() {
        val currentRole = UserRole.ADMIN
        val requiredRole = UserRole.MERCHANT

        // ADMIN이 MERCHANT보다 높은지 체크
        if (currentRole.isHigherThan(requiredRole)) {
            println("ADMIN은 MERCHANT보다 높은 권한입니다")
        }

        // ADMIN이 MERCHANT 이상인지 체크
        if (currentRole.isHigherOrEqualTo(requiredRole)) {
            println("ADMIN은 MERCHANT 권한을 포함합니다")
        }
    }

    /**
     * 예시 2: 최소 권한 체크 (Companion Object)
     */
    fun example2() {
        val currentRole = UserRole.DEVELOPER
        val requiredRole = UserRole.ADMIN

        // DEVELOPER가 ADMIN 이상인지 체크
        if (UserRole.hasMinimumLevel(currentRole, requiredRole)) {
            println("DEVELOPER는 ADMIN 권한 이상입니다")
        }
    }

    /**
     * 예시 3: Controller에서 권한 체크
     */
    fun example3Controller(userRole: UserRole) {
        // ADMIN 이상만 접근 가능
        require(userRole.isHigherOrEqualTo(UserRole.ADMIN)) {
            "ADMIN 권한이 필요합니다"
        }

        println("관리자 전용 기능 실행")
    }

    /**
     * 예시 4: Service에서 권한 비교
     */
    fun example4Service(currentRole: UserRole, targetUserRole: UserRole) {
        // 자신보다 높은 권한의 사용자는 수정할 수 없음
        require(currentRole.isHigherOrEqualTo(targetUserRole)) {
            "자신보다 높은 권한의 사용자를 수정할 수 없습니다"
        }

        println("사용자 수정 가능")
    }

    /**
     * 예시 5: 권한 레벨 정렬
     */
    fun example5Sorting() {
        val roles = listOf(
            UserRole.USER,
            UserRole.DEVELOPER,
            UserRole.ADMIN,
            UserRole.MERCHANT
        )

        // 권한 레벨 순으로 정렬 (높은 순)
        val sorted = roles.sortedByDescending { it.level }
        println("정렬 결과: ${sorted.map { it.name }}")
        // [DEVELOPER, ADMIN, MERCHANT, USER]
    }

    /**
     * 예시 6: Keycloak Role 변환
     */
    fun example6Keycloak() {
        val keycloakRole = "DEVELOPER"
        val userRole = UserRole.fromKeycloakRole(keycloakRole)

        if (userRole != null) {
            println("Keycloak Role '$keycloakRole' → UserRole.${userRole.name}")
            println("권한 레벨: ${userRole.level}")
        }
    }

    /**
     * 예시 7: Spring Security에서 활용
     */
    fun example7SpringSecurity() {
        // @PreAuthorize 어노테이션 예시 (실제 코드)
        // @PreAuthorize("hasRole('DEVELOPER')")
        // fun adminOnlyEndpoint() { ... }

        // 또는 코드에서 체크
        val currentRole = UserRole.DEVELOPER
        if (currentRole.isHigherOrEqualTo(UserRole.ADMIN)) {
            println("Admin 기능 접근 가능")
        }
    }
}
