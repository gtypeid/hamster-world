package com.hamsterworld.hamsterpg

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.hamsterpg"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.hamsterpg"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.hamsterpg"])
@EnableScheduling
@EnableAsync
class HamsterPgApplication

fun main(args: Array<String>) {
    runApplication<HamsterPgApplication>(*args)
}
