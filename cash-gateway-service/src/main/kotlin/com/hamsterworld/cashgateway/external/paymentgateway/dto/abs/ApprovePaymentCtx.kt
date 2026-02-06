package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

class ApprovePaymentCtx(
    userPublicId: String,     // E-commerce Service의 User Public ID (Snowflake Base62)
    orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    orderNumber: String,
    amount: BigDecimal,
    mid: String
) : PaymentCtx(PaymentStatus.APPROVED, userPublicId, orderPublicId, orderNumber, amount, mid)
