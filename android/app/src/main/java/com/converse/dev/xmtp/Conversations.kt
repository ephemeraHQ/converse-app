package com.converse.dev.xmtp

import android.content.Context
import android.util.Log
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
import java.security.MessageDigest
import java.util.HashMap

fun handleNewConversationV2Notification(appContext: Context, xmtpClient: Client, envelope: Envelope, remoteMessage: RemoteMessage, notificationData: NotificationData): Triple<String, String, RemoteMessage> {
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
    val conversationV2Data = ConversationV2Data(
        "v2",
        conversation.topic,
        conversation.peerAddress,
        conversation.createdAt.toString(),
        context,
        Base64.encode(conversation.keyMaterial)
    )
    val apiURI = getAsyncStorage("api-uri")
    val expoPushToken = getKeychainValue("EXPO_PUSH_TOKEN")
    if (apiURI != null && expoPushToken !== null) {
        Log.d("PushNotificationsService", "Subscribing to new topic at api: $apiURI")
        subscribeToTopic(appContext, apiURI, expoPushToken, conversation.topic)
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
    persistNewConversation(conversation.topic, conversationV2Data)
    saveConversationToStorage(xmtpClient.address, conversation.topic, conversation.peerAddress, conversation.createdAt.time, context);
    return Triple(shortAddress(conversation.peerAddress), "New Conversation", remoteMessage)
}

fun subscribeToTopic(appContext: Context, apiURI: String, expoPushToken: String, topic: String) {
    val appendTopicURI = "$apiURI/api/subscribe/append"
    val params: MutableMap<String?, String?> = HashMap()
    params["topic"] = topic
    params["expoToken"] = expoPushToken

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

fun saveConversationToStorage(account: String, topic: String, peerAddress: String, createdAt: Long, context: ConversationContext?) {
    val currentSavedConversationsString = getAsyncStorage("saved-notifications-conversations")
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
    setAsyncStorage("saved-notifications-conversations", newSavedConversationsString)
}

fun getPersistedConversation(xmtpClient: Client, topic: String): Conversation? {
    try {
        val topicBytes = topic.toByteArray(Charsets.UTF_8)
        val digest = MessageDigest.getInstance("SHA-256").digest(topicBytes)
        val encodedTopic = digest.joinToString("") { "%02x".format(it) }
        var persistedConversationData = getKeychainValue("XMTP_CONVERSATION_$encodedTopic")
        if (persistedConversationData !== null) {
            return xmtpClient.importConversation(persistedConversationData.toByteArray())
        }
    } catch (e: Exception) {
        Log.d("PushNotificationsService", "Could not retrieve conversation: $e")
    }
    return null
}

fun persistNewConversation(topic: String, conversationV2Data: ConversationV2Data) {
    try {
        val topicBytes = topic.toByteArray(Charsets.UTF_8)
        val digest = MessageDigest.getInstance("SHA-256").digest(topicBytes)
        val encodedTopic = digest.joinToString("") { "%02x".format(it) }
        setKeychainValue("XMTP_CONVERSATION_$encodedTopic", Klaxon().toJsonString(conversationV2Data))
        Log.d("PushNotificationsService", "Persisted new conversation to keychain: XMTP_CONVERSATION_$encodedTopic\"")
    } catch (e: Exception) {
        Log.d("PushNotificationsService", "Could not persist conversation: $e")
    }
}


fun getSavedConversationTitle(topic: String): String {
    try {
        Log.d("PushNotificationsService", "Getting data conversation-$topic")
        val savedConversationDict = getAsyncStorage("conversation-$topic") ?: return ""
        val parsedConversationDict = Klaxon().parse<ConversationDictData>(savedConversationDict)
        // Keeping lensHandle & ensName for now but let's delete them soon
        // and keep only title
        return (((parsedConversationDict?.title ?: parsedConversationDict?.lensHandle) ?: parsedConversationDict?.ensName) ?: parsedConversationDict?.shortAddress) ?: ""
    } catch (e: Exception) {
        return ""
    }
}