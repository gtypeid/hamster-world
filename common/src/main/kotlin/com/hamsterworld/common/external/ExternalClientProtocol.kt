package com.hamsterworld.common.external

/**
 * 모든 외부 시스템 클라이언트의 최상위 인터페이스
 *
 * Storage, Keycloak 등 모든 외부 시스템 연동 클라이언트가 이를 구현합니다.
 */
interface ExternalClientProtocol {
    /**
     * 클라이언트 이름 (로깅, 모니터링용)
     */
    fun getClientName(): String = this::class.simpleName ?: "UnknownClient"
}
