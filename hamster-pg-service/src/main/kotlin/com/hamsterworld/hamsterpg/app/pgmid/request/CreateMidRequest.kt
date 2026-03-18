package com.hamsterworld.hamsterpg.app.pgmid.request

import jakarta.validation.constraints.NotBlank

data class CreateMidRequest(
    @field:NotBlank(message = "Merchant name is required")
    val merchantName: String,

    @field:NotBlank(message = "Webhook URL is required")
    val webhookUrl: String
)
