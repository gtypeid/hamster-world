package com.hamsterworld.hamsterpg.app.pgmid.dto

import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid

data class PgMidDeactivatedEvent(
    val pgMid: PgMid
)
