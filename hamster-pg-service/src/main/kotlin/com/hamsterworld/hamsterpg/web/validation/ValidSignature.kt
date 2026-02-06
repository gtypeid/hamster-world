package com.hamsterworld.hamsterpg.web.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [SignatureConstraintValidator::class])
annotation class ValidSignature(
    val message: String = "Invalid signature",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)
