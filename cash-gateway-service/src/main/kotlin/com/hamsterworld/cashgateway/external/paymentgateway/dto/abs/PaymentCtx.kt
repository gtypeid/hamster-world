package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.payment.model.Payment
import java.math.BigDecimal

abstract class PaymentCtx(
    val paymentStatus: PaymentStatus,
    val userPublicId: String,     // E-commerce Service의 User Public ID (Snowflake Base62)
    val orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    val orderNumber: String,
    val amount: BigDecimal,
    val mid: String,  // MID (Merchant ID)
    val payment: Payment?
)
