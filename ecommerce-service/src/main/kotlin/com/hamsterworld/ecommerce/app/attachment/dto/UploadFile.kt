package com.hamsterworld.ecommerce.app.attachment.dto

data class UploadFile(
    val originalFilename: String,
    val bytes: ByteArray,
    val mimetype: String
)
