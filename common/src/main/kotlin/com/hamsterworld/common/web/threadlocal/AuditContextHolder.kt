package com.hamsterworld.common.web.threadlocal

import org.springframework.stereotype.Component

@Component
class AuditContextHolder {
    companion object {
        private val contextHolder = ThreadLocal<AuditContext>()

        fun setContext(context: AuditContext) {
            contextHolder.set(context)
        }

        fun getContext(): AuditContext? {
            return contextHolder.get()
        }

        fun clear() {
            contextHolder.remove()
        }
    }
}
