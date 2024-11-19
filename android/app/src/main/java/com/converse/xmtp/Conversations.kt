package com.converse.xmtp

import android.content.Context
import android.util.Log
import android.util.Base64.NO_WRAP
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.beust.klaxon.Klaxon
import com.converse.*
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.Group
import java.util.HashMap

fun subscribeToTopic(appContext: Context, apiURI: String, account: String, pushToken: String, topic: String, hmacKeys: String?) {
    val appendTopicURI = "$apiURI/api/subscribe/append"
    val params: MutableMap<String?, String?> = HashMap()
    params["topic"] = topic
    params["nativeToken"] = pushToken
    params["account"] = account
    params["hmacKeys"] = hmacKeys

    val parameters = JSONObject(params as Map<*, *>?)

    val jsonRequest = JsonObjectRequest(Request.Method.POST, appendTopicURI, parameters, {
        Log.d("PushNotificationsService", "Subscribe to new topic success!")
    }) { error ->
        error.printStackTrace()
        //TODO: handle failure
        Log.d("PushNotificationsService", "Subscribe to new topic error - $error")
    }

    Volley.newRequestQueue(appContext).add(jsonRequest)
}

fun saveConversationToStorage(appContext: Context, account: String, topic: String, peerAddress: String, createdAt: Long, context: ConversationContext?, spamScore: Double?) {
    val mmkv = getMmkv(appContext)
    val currentSavedConversationsString = mmkv?.decodeString("saved-notifications-conversations")
    Log.d("PushNotificationsService", "Got current saved conversations from storage: $currentSavedConversationsString")
    var currentSavedConversations = mutableListOf<SavedNotificationConversation>()
    try {
        currentSavedConversations =
            (Klaxon().parseArray<SavedNotificationConversation>(currentSavedConversationsString ?: "[]") ?: listOf()).toMutableList()
    } catch (error: Exception) {
        Log.d("PushNotificationsService", "Could not parse saved messages from storage: $currentSavedConversationsString - $error")
    }
    val newConversationToSave = SavedNotificationConversation(topic = topic, peerAddress= peerAddress, createdAt= createdAt, context= context, account = account, spamScore = spamScore)
    currentSavedConversations += newConversationToSave
    val newSavedConversationsString = Klaxon().toJsonString(currentSavedConversations)
    mmkv?.putString("saved-notifications-conversations", newSavedConversationsString)
}

suspend fun getNewConversation(xmtpClient: Client, contentTopic: String): Conversation? {
    return try {
        if (isV3WelcomeTopic(contentTopic)) {
            // Welcome envelopes are too large to send in a push, so a bit of a hack to get the latest group
            xmtpClient.conversations.sync()
            val conversation = xmtpClient.findConversationByTopic(contentTopic)

            conversation?.sync()
            conversation
        } else {
            null
        }
    } catch (error: Exception) {
        sentryTrackError(error, mapOf("message" to "Could not sync new group"))
        null
    }
}

suspend fun getConversation(xmtpClient: Client, conversationTopic: String): Conversation? {
    return try {
        // Welcome envelopes are too large to send in a push, so a bit of a hack to get the latest group
        xmtpClient.conversations.sync()
        val conversation = xmtpClient.findConversationByTopic(conversationTopic)
        conversation?.sync()
        conversation
    } catch (error: Exception) {
        sentryTrackError(error, mapOf("message" to "Could not sync new group"))
        null
    }
}

suspend fun getGroup(xmtpClient: Client, groupId: String): Group? {
    return try {
        // Welcome envelopes are too large to send in a push, so a bit of a hack to get the latest group
        xmtpClient.conversations.sync()
        val group = xmtpClient.findGroup(groupId)
        group?.sync()
        group
    } catch (error: Exception) {
        sentryTrackError(error, mapOf("message" to "Could not sync new group"))
        null
    }
}