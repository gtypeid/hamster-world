package com.hamsterworld.notification

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.notification"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.notification"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.notification"])
@EnableScheduling
class NotificationApplication

fun main(args: Array<String>) {
    runApplication<NotificationApplication>(*args)
}
