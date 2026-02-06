package com.hamsterworld.hamsterpg.app.payment.request

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.hamsterworld.hamsterpg.web.validation.ValidSignature
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import java.math.BigDecimal

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes(
    JsonSubTypes.Type(value = CreatePaymentRequest::class, name = "PAYMENT"),
    JsonSubTypes.Type(value = CancelPaymentRequest::class, name = "CANCEL")
)
@ValidSignature
sealed class PaymentRequest {
    abstract val midId: String
    abstract val timestamp: String
    abstract val signature: String
}

@ValidSignature
data class CreatePaymentRequest(
    @field:NotBlank
    override val midId: String,

    @field:NotBlank
    override val timestamp: String,

    @field:NotBlank
    override val signature: String,

    @field:NotBlank
    val orderPublicId: String,

    @field:Positive
    val amount: BigDecimal,

    @field:NotBlank
    val callbackUrl: String,

    val echo: String? = null
) : PaymentRequest()

@ValidSignature
data class CancelPaymentRequest(
    @field:NotBlank
    override val midId: String,

    @field:NotBlank
    override val timestamp: String,

    @field:NotBlank
    override val signature: String,

    @field:NotBlank
    val tid: String
) : PaymentRequest()
