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
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.messages.Envelope
import org.xmtp.proto.keystore.api.v1.Keystore.TopicMap.TopicData
import java.security.MessageDigest
import java.util.HashMap


fun hasForbiddenPattern(address: String): Boolean { return address.startsWith("0x0000") && address.endsWith("0000") }

fun handleNewConversationV2Notification(appContext: Context, xmtpClient: Client, envelope: Envelope, remoteMessage: RemoteMessage, notificationData: NotificationData): Triple<String, String, RemoteMessage>? {
    val conversation = xmtpClient.conversations.fromInvite((envelope))
    var context: ConversationContext? = null;
    when (conversation) {
        is Conversation.V1 -> {
            // Nothing to do
        }
        is Conversation.V2 -> {
            val conversationV2 = conversation.conversationV2
            if (conversationV2.context.conversationId !== null) {
                context = ConversationContext(
                    conversationV2.context.conversationId,
                    conversationV2.context.metadataMap
                )
            }
        }
    }
    Log.d("PushNotificationsService", "Decoded new conversation from invite")
    val mmkv = getMmkv(appContext)
    var apiURI = mmkv?.decodeString("api-uri")
    // TODO => stop using async storage
    if (apiURI == null) {
        apiURI = getAsyncStorage("api-uri")
    }
    val pushToken = getKeychainValue("PUSH_TOKEN")
    if (apiURI != null && pushToken !== null && !hasForbiddenPattern(conversation.peerAddress)) {
        Log.d("PushNotificationsService", "Subscribing to new topic at api: $apiURI")
        subscribeToTopic(appContext, apiURI, xmtpClient.address, pushToken, conversation.topic)
    }
    // Let's add the topic to the notification content
    val newNotificationData = NotificationData(
        notificationData.message,
        notificationData.timestampNs,
        notificationData.contentTopic,
        notificationData.sentViaConverse,
        notificationData.account,
        conversation.topic
    )
    val newNotificationDataJson = Klaxon().toJsonString(newNotificationData)
    remoteMessage.data["body"] = newNotificationDataJson
    persistNewConversation(xmtpClient.address, conversation)
    saveConversationToStorage(appContext, xmtpClient.address, conversation.topic, conversation.peerAddress, conversation.createdAt.time, context);
    if (hasForbiddenPattern(conversation.peerAddress)) {
        return null
    }
    return Triple(shortAddress(conversation.peerAddress), "New Conversation", remoteMessage)
}

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

fun saveConversationToStorage(appContext: Context, account: String, topic: String, peerAddress: String, createdAt: Long, context: ConversationContext?) {
    val mmkv = getMmkv(appContext)
    val currentSavedConversationsString = mmkv?.decodeString("saved-notifications-conversations")
    Log.d("PushNotificationsService", "Got current saved conversations from storage: $currentSavedConversationsString")
    var currentSavedConversations = listOf<SavedNotificationConversation>()
    try {
        currentSavedConversations = Klaxon().parseArray<SavedNotificationConversation>(currentSavedConversationsString ?: "[]") ?: listOf()
    } catch (error: Exception) {
        Log.d("PushNotificationsService", "Could not parse saved messages from storage: $currentSavedConversationsString - $error")
    }
    val newConversationToSave = SavedNotificationConversation(topic = topic, peerAddress= peerAddress, createdAt= createdAt, context= context, account = account)
    currentSavedConversations += newConversationToSave
    val newSavedConversationsString = Klaxon().toJsonString(currentSavedConversations)
    mmkv?.putString("saved-notifications-conversations", newSavedConversationsString)
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
        return parsedConversationDict?.title ?: parsedConversationDict?.shortAddress ?: "";
    } catch (e: Exception) {
        return ""
    }
}