package com.hamsterworld.progression

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.progression"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.progression"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.progression"])
@EnableScheduling
class ProgressionApplication

fun main(args: Array<String>) {
    runApplication<ProgressionApplication>(*args)
}
