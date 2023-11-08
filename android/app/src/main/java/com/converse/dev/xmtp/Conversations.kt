package com.converse.dev.xmtp

import android.content.Context
import android.util.Log
import android.util.Base64.NO_WRAP
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.beust.klaxon.Klaxon
import com.converse.dev.*
import com.google.crypto.tink.subtle.Base64

import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.messages.Envelope
import org.xmtp.proto.keystore.api.v1.Keystore.TopicMap.TopicData
import java.security.MessageDigest
import java.util.HashMap

fun subscribeToTopic(appContext: Context, apiURI: String, account: String, pushToken: String, topic: String) {
    val appendTopicURI = "$apiURI/api/subscribe/append"
    val params: MutableMap<String?, String?> = HashMap()
    params["topic"] = topic
    params["nativeToken"] = pushToken
    params["account"] = account

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

suspend fun getNewConversationFromEnvelope(xmtpClient: Client, envelope: Envelope): Conversation? {
    return try {
        if (isInviteTopic(envelope.contentTopic)) {
            val conversation = xmtpClient.conversations.fromInvite(envelope)
            when (conversation) {
                is Conversation.V1 -> {
                    // Nothing to do
                }
                is Conversation.V2 -> {
                    persistNewConversation(xmtpClient.address, conversation)
                }
            }
            conversation
        } else {
            null
        }
    } catch (e: Exception) {
        Log.e("PushNotificationsService", "Could not decode new conversation envelope", e)
        null
    }
}

fun getPersistedConversation(xmtpClient: Client, topic: String): Conversation? {
    try {
        val topicBytes = topic.toByteArray(Charsets.UTF_8)
        val digest = MessageDigest.getInstance("SHA-256").digest(topicBytes)
        val encodedTopic = digest.joinToString("") { "%02x".format(it) }
        val persistedTopicData = getKeychainValue("XMTP_TOPIC_DATA_${xmtpClient.address}_$encodedTopic")
        if (persistedTopicData !== null) {
            val data = TopicData.parseFrom(Base64.decode(persistedTopicData, NO_WRAP))
            Log.d("PushNotificationsService", "Got saved conversation from topic data")
            return xmtpClient.conversations.importTopicData(data)
        }

        // TODO => remove here as it's the old way of saving convos and we don't use it anymore
        val persistedConversationData = getKeychainValue("XMTP_CONVERSATION_$encodedTopic")
        if (persistedConversationData !== null) {
            Log.d("PushNotificationsService", "Got saved conversation persisted data")
            return xmtpClient.importConversation(persistedConversationData.toByteArray())
        }
    } catch (e: Exception) {
        Log.d("PushNotificationsService", "Could not retrieve conversation: $e")
    }
    return null
}

fun persistNewConversation(account: String, conversation: Conversation) {
    try {
        val topicBytes = conversation.topic.toByteArray(Charsets.UTF_8)
        val digest = MessageDigest.getInstance("SHA-256").digest(topicBytes)
        val encodedTopic = digest.joinToString("") { "%02x".format(it) }
        val conversationTopicData = Base64.encodeToString(conversation.toTopicData().toByteArray(), NO_WRAP)
        setKeychainValue("XMTP_TOPIC_DATA_${account}_$encodedTopic", conversationTopicData)
        Log.d("PushNotificationsService", "Persisted new conversation to keychain: XMTP_TOPIC_DATA_${account}_$encodedTopic")
    } catch (e: Exception) {
        Log.d("PushNotificationsService", "Could not persist conversation: $e")
    }
}

fun getSavedConversationTitle(appContext: Context, topic: String): String {
    try {
        Log.d("PushNotificationsService", "Getting data conversation-$topic")
        val mmkv = getMmkv(appContext)
        val savedConversationDict = mmkv?.decodeString("conversation-$topic") ?: return ""
        val parsedConversationDict = Klaxon().parse<ConversationDictData>(savedConversationDict)
        return parsedConversationDict?.title ?: parsedConversationDict?.shortAddress ?: ""
    } catch (e: Exception) {
        return ""
    }
}