package com.converse.dev

import com.beust.klaxon.Converter
import com.beust.klaxon.JsonValue
import com.beust.klaxon.Klaxon

sealed class NotificationPayload()

data class GroupInviteNotification(val groupInviteId: String, val joinRequestId: String, val address: String, val account: String) : NotificationPayload()
data class GroupSyncNotification(val contentTopic: String, val account: String) : NotificationPayload()
// Add new Classes for custom notifications here

class NotificationConverter : Converter {

    override fun canConvert(cls: Class<*>) = cls == NotificationPayload::class.java

    override fun fromJson(jv: JsonValue): NotificationPayload {
        val obj = jv.obj ?: throw IllegalArgumentException("Expected a JSON object")
        val type = obj.string("type") ?: throw IllegalArgumentException("Expected a 'type' field")
        
        return when (type) {
            "group_join_request" -> Klaxon().parseFromJsonObject<GroupInviteNotification>(obj)!!
            "group_sync" -> Klaxon().parseFromJsonObject<GroupSyncNotification>(obj)!!
            // Add more cases for other types here
            else -> throw IllegalArgumentException("Unknown payload type: $type")
        }
    }

    override fun toJson(value: Any): String {
        return when (value) {
            is GroupInviteNotification -> Klaxon().toJsonString(value)
            is NotificationData -> Klaxon().toJsonString(value)
            else -> throw IllegalArgumentException("Unknown payload type")
        }
    }
}
