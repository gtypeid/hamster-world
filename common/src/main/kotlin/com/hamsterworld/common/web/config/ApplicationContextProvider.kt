package com.hamsterworld.common.web.config
import org.springframework.beans.BeansException
import org.springframework.context.ApplicationContext
import org.springframework.context.ApplicationContextAware
import org.springframework.stereotype.Component
@Component
class ApplicationContextProvider : ApplicationContextAware {
    @Throws(BeansException::class)
    override fun setApplicationContext(applicationContext: ApplicationContext) {
        context = applicationContext
    }
    companion object {
        private var context: ApplicationContext? = null
        fun <T> getBean(beanClass: Class<T>): T {
            return context?.getBean(beanClass)
                ?: throw IllegalStateException("ApplicationContext not initialized")
        }
        fun <T> getBeanOrNull(beanClass: Class<T>): T? {
            return context?.getBean(beanClass)
        }
    }
}
