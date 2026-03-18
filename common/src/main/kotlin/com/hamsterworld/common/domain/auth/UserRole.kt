package com.hamsterworld.common.domain.auth
enum class UserRole(
    val keycloakRoleName: String,
    val level: Int
) {
    USER("USER", 1),
    VENDOR("VENDOR", 2),
    MERCHANT("MERCHANT", 3),
    ADMIN("ADMIN", 4),
    DEVELOPER("DEVELOPER", 5),
    SYSTEM("SYSTEM", 6);
    companion object {
        fun fromKeycloakRole(roleName: String): UserRole? {
            return entries.find { it.keycloakRoleName == roleName }
        }
        fun hasMinimumLevel(currentRole: UserRole, requiredRole: UserRole): Boolean {
            return currentRole.level >= requiredRole.level
        }
        fun compareLevel(role1: UserRole, role2: UserRole): Int {
            return role1.level.compareTo(role2.level)
        }
    }
    fun isHigherThan(other: UserRole): Boolean {
        return this.level > other.level
    }
    fun isHigherOrEqualTo(other: UserRole): Boolean {
        return this.level >= other.level
    }
    fun isLowerThan(other: UserRole): Boolean {
        return this.level < other.level
    }
    fun isLowerOrEqualTo(other: UserRole): Boolean {
        return this.level <= other.level
    }
}
