package com.hamsterworld.ecommerce.external.storage.abs
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Component
@Component
class StorageClientRegistry(
    private val clients: List<StorageClientProtocol>
) {
    fun <T : StorageClientProtocol> getClient(clientClass: Class<T>): T {
        return clients.firstOrNull { clientClass.isInstance(it) }
            ?.let { clientClass.cast(it) }
            ?: throw CustomRuntimeException("Storage 클라이언트를 찾을 수 없습니다: ${clientClass.simpleName}")
    }
}
