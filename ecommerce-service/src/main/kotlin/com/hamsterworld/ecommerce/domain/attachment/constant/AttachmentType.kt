package com.hamsterworld.ecommerce.domain.attachment.constant

enum class AttachmentType(
    val bucket: String,
    val root: String
) {
    PRODUCT("app-storage", "product")
}
