package com.hamsterworld.ecommerce

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.ecommerce"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.ecommerce"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.ecommerce"])
@EnableScheduling
class EcommerceApplication

fun main(args: Array<String>) {
    runApplication<EcommerceApplication>(*args)
}
