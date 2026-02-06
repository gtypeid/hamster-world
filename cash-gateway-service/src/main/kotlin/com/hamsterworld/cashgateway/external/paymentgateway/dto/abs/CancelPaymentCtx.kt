package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.payment.model.Payment
import java.math.BigDecimal

class CancelPaymentCtx(
    userPublicId: String,     // E-commerce Service의 User Public ID (Snowflake Base62)
    orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    orderNumber: String,
    amount: BigDecimal,
    mid: String,
    payment: Payment
) : PaymentCtx(PaymentStatus.CANCELLED, userPublicId, orderPublicId, orderNumber, amount, mid, payment)
