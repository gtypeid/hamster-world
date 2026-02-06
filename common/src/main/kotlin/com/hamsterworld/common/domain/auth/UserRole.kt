package com.hamsterworld.common.domain.auth

/**
 * Keycloak Realm Role
 *
 * 권한 계층 구조:
 * SYSTEM > DEVELOPER > ADMIN > MERCHANT > VENDOR > USER
 *
 * 사용자는 반드시 하나의 Realm Role만 가집니다.
 * keycloakRoleName: Keycloak에 실제로 등록된 Role 이름 (대문자)
 */
enum class UserRole(
    val keycloakRoleName: String,
    val level: Int  // 권한 레벨 (높을수록 강력)
) {
    USER("USER", 1),              // 일반 사용자
    VENDOR("VENDOR", 2),          // 판매자 (현재 사용하지 않음)
    MERCHANT("MERCHANT", 3),      // 머천트 (판매자)
    ADMIN("ADMIN", 4),            // 관리자
    DEVELOPER("DEVELOPER", 5),    // 개발자
    SYSTEM("SYSTEM", 6);          // 시스템 (내부 서비스간 통신)

    companion object {
        /**
         * Keycloak Role 이름으로 UserRole 찾기
         *
         * @param roleName Keycloak Role 이름
         * @return UserRole 또는 null
         */
        fun fromKeycloakRole(roleName: String): UserRole? {
            return entries.find { it.keycloakRoleName == roleName }
        }

        /**
         * 최소 권한 레벨 체크
         *
         * @param currentRole 현재 사용자 Role
         * @param requiredRole 필요한 최소 Role
         * @return 권한 충족 여부
         */
        fun hasMinimumLevel(currentRole: UserRole, requiredRole: UserRole): Boolean {
            return currentRole.level >= requiredRole.level
        }

        /**
         * 권한 레벨 비교
         *
         * @param role1 비교할 Role 1
         * @param role2 비교할 Role 2
         * @return role1이 role2보다 높으면 양수, 같으면 0, 낮으면 음수
         */
        fun compareLevel(role1: UserRole, role2: UserRole): Int {
            return role1.level.compareTo(role2.level)
        }
    }

    /**
     * 특정 Role보다 높은 권한인지 체크
     *
     * @param other 비교 대상 Role
     * @return 현재 Role이 other보다 높으면 true
     */
    fun isHigherThan(other: UserRole): Boolean {
        return this.level > other.level
    }

    /**
     * 특정 Role보다 높거나 같은 권한인지 체크
     *
     * @param other 비교 대상 Role
     * @return 현재 Role이 other보다 높거나 같으면 true
     */
    fun isHigherOrEqualTo(other: UserRole): Boolean {
        return this.level >= other.level
    }

    /**
     * 특정 Role보다 낮은 권한인지 체크
     *
     * @param other 비교 대상 Role
     * @return 현재 Role이 other보다 낮으면 true
     */
    fun isLowerThan(other: UserRole): Boolean {
        return this.level < other.level
    }

    /**
     * 특정 Role보다 낮거나 같은 권한인지 체크
     *
     * @param other 비교 대상 Role
     * @return 현재 Role이 other보다 낮거나 같으면 true
     */
    fun isLowerOrEqualTo(other: UserRole): Boolean {
        return this.level <= other.level
    }
}
