package com.hamsterworld.common.web.config

import org.springframework.beans.BeansException
import org.springframework.context.ApplicationContext
import org.springframework.context.ApplicationContextAware
import org.springframework.stereotype.Component

/**
 * Spring ApplicationContext 정적 접근 Provider
 *
 * EntityListener 등 Spring Bean이 아닌 클래스에서
 * Spring Bean에 접근할 수 있도록 합니다.
 */
@Component
class ApplicationContextProvider : ApplicationContextAware {

    @Throws(BeansException::class)
    override fun setApplicationContext(applicationContext: ApplicationContext) {
        context = applicationContext
    }

    companion object {
        private var context: ApplicationContext? = null

        /**
         * Bean 가져오기
         */
        fun <T> getBean(beanClass: Class<T>): T {
            return context?.getBean(beanClass)
                ?: throw IllegalStateException("ApplicationContext not initialized")
        }

        /**
         * Bean 가져오기 (nullable)
         */
        fun <T> getBeanOrNull(beanClass: Class<T>): T? {
            return context?.getBean(beanClass)
        }
    }
}
