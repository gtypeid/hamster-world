package com.hamsterworld.common.domain.auth
object UserRoleExample {
    fun example1() {
        val currentRole = UserRole.ADMIN
        val requiredRole = UserRole.MERCHANT
        if (currentRole.isHigherThan(requiredRole)) {
            println("ADMIN은 MERCHANT보다 높은 권한입니다")
        }
        if (currentRole.isHigherOrEqualTo(requiredRole)) {
            println("ADMIN은 MERCHANT 권한을 포함합니다")
        }
    }
    fun example2() {
        val currentRole = UserRole.DEVELOPER
        val requiredRole = UserRole.ADMIN
        if (UserRole.hasMinimumLevel(currentRole, requiredRole)) {
            println("DEVELOPER는 ADMIN 권한 이상입니다")
        }
    }
    fun example3Controller(userRole: UserRole) {
        require(userRole.isHigherOrEqualTo(UserRole.ADMIN)) {
            "ADMIN 권한이 필요합니다"
        }
        println("관리자 전용 기능 실행")
    }
    fun example4Service(currentRole: UserRole, targetUserRole: UserRole) {
        require(currentRole.isHigherOrEqualTo(targetUserRole)) {
            "자신보다 높은 권한의 사용자를 수정할 수 없습니다"
        }
        println("사용자 수정 가능")
    }
    fun example5Sorting() {
        val roles = listOf(
            UserRole.USER,
            UserRole.DEVELOPER,
            UserRole.ADMIN,
            UserRole.MERCHANT
        )
        val sorted = roles.sortedByDescending { it.level }
        println("정렬 결과: ${sorted.map { it.name }}")
    }
    fun example6Keycloak() {
        val keycloakRole = "DEVELOPER"
        val userRole = UserRole.fromKeycloakRole(keycloakRole)
        if (userRole != null) {
            println("Keycloak Role '$keycloakRole' → UserRole.${userRole.name}")
            println("권한 레벨: ${userRole.level}")
        }
    }
    fun example7SpringSecurity() {
        val currentRole = UserRole.DEVELOPER
        if (currentRole.isHigherOrEqualTo(UserRole.ADMIN)) {
            println("Admin 기능 접근 가능")
        }
    }
}
