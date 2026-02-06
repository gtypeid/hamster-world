package com.hamsterworld.common.web.threadlocal

import org.springframework.stereotype.Component

@Component
class EntityChangeContextHolder {
    companion object {
        private val originalJsonValues = ThreadLocal<MutableMap<String, String>>()

        fun setOriginalJson(entityKey: String, jsonString: String) {
            var map = originalJsonValues.get()
            if (map == null) {
                map = mutableMapOf()
            }
            map[entityKey] = jsonString
            originalJsonValues.set(map)
        }

        fun getOriginalJson(entityKey: String): String? {
            val map = originalJsonValues.get()
            return map?.get(entityKey)
        }

        fun clear() {
            originalJsonValues.remove()
        }
    }
}
