package com.hamsterworld.progression.web.csv

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.hamsterworld.progression.domain.archive.constant.ArchiveType
import com.hamsterworld.progression.domain.archive.model.ArchiveMaster
import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.constant.MissionConditionEmitter
import com.hamsterworld.progression.domain.mission.constant.MissionType
import com.hamsterworld.progression.domain.mission.constant.ProgressType
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import jakarta.annotation.PostConstruct
import org.apache.commons.csv.CSVFormat
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import java.io.InputStreamReader

@Component
class ArchiveMasterLoader {

    private val logger = LoggerFactory.getLogger(javaClass)
    private val objectMapper = jacksonObjectMapper()

    private val archiveMasterMap = mutableMapOf<String, ArchiveMaster>()

    @PostConstruct
    fun loadArchiveMasters() {
        try {
            val resource = ClassPathResource("master/archives.csv")
            val reader = InputStreamReader(resource.inputStream, Charsets.UTF_8)

            val records = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .build()
                .parse(reader)

            records.forEach { record ->
                val archiveId = record.get("archive_id")
                val progressType = ProgressType.valueOf(record.get("progress_type"))

                val condition = if (progressType == ProgressType.EVENT_BASED) {
                    MissionCondition(
                        type = MissionType.valueOf(record.get("condition_type")),
                        requirement = record.get("requirement").toInt(),
                        filtersJson = record.get("condition_filters").takeIf { it.isNotBlank() && it != "{}" }
                    )
                } else {
                    null
                }

                val archiveMaster = ArchiveMaster(
                    archiveId = archiveId,
                    archiveCode = record.get("archive_code"),
                    name = record.get("name"),
                    description = record.get("description"),
                    archiveType = ArchiveType.valueOf(record.get("archive_type")),
                    progressType = progressType,
                    sortOrder = record.get("sort_order").toInt(),
                    condition = condition,
                    statKey = if (progressType == ProgressType.STAT_BASED) record.get("condition_type") else null,
                    emitter = MissionConditionEmitter(
                        rewardType = RewardType.valueOf(record.get("reward_type")),
                        rewardAmount = record.get("reward_amount").toInt()
                    )
                )

                archiveMasterMap[archiveId] = archiveMaster
            }

            logger.info("✅ Loaded ${archiveMasterMap.size} Archive Masters from CSV")
        } catch (e: Exception) {
            logger.error("❌ Failed to load Archive Masters", e)
            throw e
        }
    }

    fun getArchiveMaster(archiveId: String): ArchiveMaster? {
        return archiveMasterMap[archiveId]
    }

    fun getAllArchiveMasters(): List<ArchiveMaster> {
        return archiveMasterMap.values.sortedBy { it.sortOrder }
    }

    fun getEventBasedArchives(): List<ArchiveMaster> {
        return archiveMasterMap.values.filter { it.isEventBased() }
    }
}
