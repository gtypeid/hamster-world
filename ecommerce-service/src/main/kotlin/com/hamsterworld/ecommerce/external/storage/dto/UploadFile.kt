package com.hamsterworld.ecommerce.external.storage.dto

data class UploadFile(
    val originalFilename: String,
    val bytes: ByteArray,
    val mimetype: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as UploadFile

        if (originalFilename != other.originalFilename) return false
        if (!bytes.contentEquals(other.bytes)) return false
        if (mimetype != other.mimetype) return false

        return true
    }

    override fun hashCode(): Int {
        var result = originalFilename.hashCode()
        result = 31 * result + bytes.contentHashCode()
        result = 31 * result + mimetype.hashCode()
        return result
    }
}
