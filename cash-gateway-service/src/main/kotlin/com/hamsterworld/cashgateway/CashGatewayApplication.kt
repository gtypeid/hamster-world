package com.hamsterworld.cashgateway

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.cashgateway"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.cashgateway"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.cashgateway"])
@EnableScheduling
class CashGatewayApplication

fun main(args: Array<String>) {
    runApplication<CashGatewayApplication>(*args)
}
