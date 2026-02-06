package com.hamsterworld.payment

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.payment"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.payment"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.payment"])
@EnableScheduling
class PaymentServiceApplication

fun main(args: Array<String>) {
    runApplication<PaymentServiceApplication>(*args)
}
