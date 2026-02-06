package com.hamsterworld.common.domain.abs

import com.hamsterworld.common.web.config.ApplicationContextProvider
import com.hamsterworld.common.web.id.SnowflakeIdEncoder
import com.hamsterworld.common.web.id.SnowflakeIdGenerator
import com.hamsterworld.common.web.id.SnowflakeIdInfo
import com.hamsterworld.common.web.id.SnowflakeIdParser
import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.Transient
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.domain.AbstractAggregateRoot
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@MappedSuperclass
@EntityListeners(
    AuditingEntityListener::class
)
abstract class AbsDomain : AbstractAggregateRoot<AbsDomain>() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long? = null
        protected set

    @Column(nullable = false, unique = true, name = "public_id", length = 20)
    var publicId: String = ""
        protected set

    init {
        if (publicId.isEmpty()) {
            try {
                val idGenerator = ApplicationContextProvider.Companion
                    .getBean(SnowflakeIdGenerator::class.java)
                this.publicId = idGenerator.nextIdString()
            } catch (e: Exception) {
            }
        }
    }

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()

    @LastModifiedDate
    @Column(name = "modified_at")
    var modifiedAt: LocalDateTime? = null

    @Transient
    fun getPublicIdInfo(): SnowflakeIdInfo? {
        if (publicId.isEmpty()) return null
        return try {
            val longId = SnowflakeIdEncoder.decode(publicId)
            SnowflakeIdParser.parse(longId)
        } catch (e: Exception) {
            null
        }
    }

    fun assignPublicId(id: String) {
        this.publicId = id
    }

    fun getType(): String {
        return this::class.simpleName ?: "Unknown"
    }

    fun pullDomainEvents(): List<Any> {
        val events = ArrayList(domainEvents())
        clearDomainEvents()
        return events
    }
}
