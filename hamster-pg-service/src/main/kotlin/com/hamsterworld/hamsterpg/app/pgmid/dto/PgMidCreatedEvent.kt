package com.hamsterworld.hamsterpg.app.pgmid.dto

import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid

data class PgMidCreatedEvent(
    val pgMid: PgMid
)
