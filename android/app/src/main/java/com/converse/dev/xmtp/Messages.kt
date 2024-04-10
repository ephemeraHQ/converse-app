package com.converse.dev.xmtp

import android.content.Context
import android.util.Log
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.beust.klaxon.Klaxon

import com.converse.dev.*
import com.converse.dev.PushNotificationsService.Companion.TAG
import android.util.Base64
import android.util.Base64.NO_WRAP
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.delegates.encodedInBase64
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.DecodedMessage
import org.xmtp.android.library.codecs.Reaction
import org.xmtp.android.library.codecs.RemoteAttachment
import org.xmtp.android.library.codecs.Reply
import org.xmtp.android.library.messages.Envelope
import org.xmtp.proto.keystore.api.v1.Keystore
import org.xmtp.proto.message.api.v1.MessageApiOuterClass
import org.xmtp.proto.message.contents.Content
import java.util.HashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

data class NotificationDataResult(
    val title: String = "",
    val body: String = "",
    val remoteMessage: RemoteMessage? = null,
    val messageId: String? = null,
    val shouldShowNotification: Boolean = false
)

data class DecodedMessageResult(
    val content: String? = null,
    val senderAddress: String? = null,
    val forceIgnore: Boolean = false,
    val id: String? = null
)

suspend fun handleNewConversationFirstMessage(
    appContext: Context,
    xmtpClient: Client,
    conversation: Conversation,
    remoteMessage: RemoteMessage
): NotificationDataResult {

    var shouldShowNotification = false
    var attempts = 0
    var messageId: String? = null
    var body = ""

    while (attempts < 5) {
        try {
            val messages = conversation.messages(limit = 1, direction = MessageApiOuterClass.SortDirection.SORT_DIRECTION_ASCENDING)
            if (messages.isNotEmpty()) {
                val message = messages[0]
                messageId = message.id
                var conversationContext: ConversationContext? = null
                val contentType = getContentTypeString(message.encodedContent.type)

                var messageContent: String? = null
                if (contentType.startsWith("xmtp.org/text:")) {
                    messageContent = message.encodedContent.content.toStringUtf8()
                }

                val mmkv = getMmkv(appContext)
                var apiURI = mmkv?.decodeString("api-uri")
                if (apiURI == null) {
                    apiURI = getAsyncStorage("api-uri")
                }

                val spamScore = computeSpamScore(
                    address = conversation.peerAddress,
                    message = messageContent,
                    sentViaConverse = message.sentViaConverse,
                    contentType = contentType,
                    appContext = appContext,
                    apiURI = apiURI
                )
                Log.d(TAG, "spamScore: $spamScore for topic: ${message.topic}")

                when (conversation) {
                    is Conversation.V1 -> {
                        // Nothing to do
                    }
                    is Conversation.V2 -> {
                        val conversationV2 = conversation.conversationV2

                        conversationContext = ConversationContext(
                            conversationV2.context.conversationId,
                            conversationV2.context.metadataMap
                        )

                        // Save conversation and its spamScore to mmkv
                        saveConversationToStorage(
                            appContext,
                            xmtpClient.address,
                            conversationV2.topic,
                            conversationV2.peerAddress,
                            conversationV2.createdAt.time,
                            conversationContext,
                            spamScore,
                        )
                    }
                    else -> {
                        // Nothing to do (group)
                    }
                }

                val decodedMessageResult = handleMessageByContentType(
                    appContext,
                    message,
                    xmtpClient,
                    message.sentViaConverse
                )

                if (decodedMessageResult.senderAddress == xmtpClient.address || decodedMessageResult.forceIgnore) {
                    // Drop the message
                    Log.d(TAG, "Not showing a notification")
                } else if (decodedMessageResult.content != null) {
                    shouldShowNotification = true
                    body = decodedMessageResult.content
                }

                if (spamScore >= 1) {
                    Log.d(TAG, "Not showing a notification because considered spam")
                    shouldShowNotification = false
                } else {
                    val pushToken = getKeychainValue("PUSH_TOKEN")

                    if (apiURI != null && pushToken !== null) {
                        Log.d(TAG, "Subscribing to new topic at api: $apiURI")
                        xmtpClient.conversations.importTopicData(conversation.toTopicData())
                        val request = Keystore.GetConversationHmacKeysRequest.newBuilder().addTopics(conversation.topic).build()
                        val hmacKeys = xmtpClient.conversations.getHmacKeys(request)
                        var conversationHmacKeys  = hmacKeys.hmacKeysMap[conversation.topic]?.let {
                            Base64.encodeToString(it.toByteArray(), NO_WRAP)
                        }
                        subscribeToTopic(appContext, apiURI, xmtpClient.address, pushToken, conversation.topic, conversationHmacKeys)
                        shouldShowNotification = true
                    }
                }
                break
            } else {
                Log.d(TAG, "No message found in conversation, for now.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching messages: $e")
            break
        }

        // Wait for 4 seconds before the next attempt
        delay(4000)

        attempts++
    }

    return NotificationDataResult(
        title = shortAddress(conversation.peerAddress),
        body = body,
        remoteMessage = remoteMessage,
        messageId = messageId,
        shouldShowNotification = shouldShowNotification
    )
}

fun handleOngoingConversationMessage(
    appContext: Context,
    xmtpClient: Client,
    envelope: Envelope,
    remoteMessage: RemoteMessage,
    sentViaConverse: Boolean
): NotificationDataResult {
    val conversation = getPersistedConversation(xmtpClient, envelope.contentTopic)
        ?: run {
            Log.d("PushNotificationsService", "No conversation found for ${envelope.contentTopic}")
            return NotificationDataResult()
        }

    val message = conversation.decode(envelope)
    val contentTopic = envelope.contentTopic
    var conversationTitle = getSavedConversationTitle(appContext, contentTopic)

    val decodedMessageResult = handleMessageByContentType(
        appContext,
        message,
        xmtpClient,
        sentViaConverse
    )

    val shouldShowNotification = if (decodedMessageResult.senderAddress != xmtpClient.address && !decodedMessageResult.forceIgnore && decodedMessageResult.content != null) {
        if (conversationTitle.isEmpty() && decodedMessageResult.senderAddress != null) {
            conversationTitle = shortAddress(decodedMessageResult.senderAddress)
        }
        true
    } else {
        Log.d(TAG, "[NotificationExtension] Not showing a notification")
        false
    }

    return NotificationDataResult(
        title = conversationTitle,
        body = decodedMessageResult.content ?: "",
        remoteMessage = remoteMessage,
        messageId = decodedMessageResult.id,
        shouldShowNotification = shouldShowNotification
    )
}

fun handleMessageByContentType(
    appContext: Context,
    decodedMessage: DecodedMessage,
    xmtpClient: Client,
    sentViaConverse: Boolean
): DecodedMessageResult {
    var contentType = getContentTypeString(decodedMessage.encodedContent.type)
    var contentToReturn: String?
    var contentToSave: String?
    var referencedMessageId: String? = null
    var forceIgnore = false

    var messageContent = decodedMessage.content<Any>()

    if (contentType.startsWith("xmtp.org/reply:")) {
        val replyContent = messageContent as Reply
        referencedMessageId = replyContent.reference
        contentType = getContentTypeString(replyContent.contentType)
        messageContent = replyContent.content
    }

    try {
        when {
            contentType.startsWith("xmtp.org/text:") -> {
                contentToSave = messageContent as String
                contentToReturn = contentToSave
            }

            contentType.startsWith("xmtp.org/remoteStaticAttachment:") -> {
                val remoteAttachment = messageContent as RemoteAttachment
                contentToSave = getJsonRemoteAttachment(remoteAttachment)
                contentToReturn = "📎 Media"
            }

            contentType.startsWith("xmtp.org/transactionReference:") || contentType.startsWith("coinbase.com/coinbase-messaging-payment-activity:") -> {
                contentToSave = messageContent as String
                contentToReturn = "💸 Transaction"
            }

            contentType.startsWith("xmtp.org/reaction:") -> {
                val reaction = messageContent as Reaction?
                val action = reaction?.action?.javaClass?.simpleName?.lowercase()
                val schema = reaction?.schema?.javaClass?.simpleName?.lowercase()
                val content = reaction?.content
                referencedMessageId = reaction?.reference
                forceIgnore = action == "removed"
                contentToSave = getJsonReaction(decodedMessage)
                contentToReturn = when {
                    action != "removed" && schema == "unicode" && content != null -> "Reacted $content to a message"
                    else -> "Reacted to a message"
                }
            }

            contentType.startsWith("xmtp.org/readReceipt:") -> {
                // Ignoring
                contentToSave = null
                contentToReturn = null
            }

            else -> {
                sentryTrackMessage(
                    "NOTIFICATION_UNKNOWN_CONTENT_TYPE",
                    mapOf("contentType" to contentType, "topic" to decodedMessage.topic)
                )
                println("[NotificationExtension] UNKNOWN CONTENT TYPE: $contentType")
                return DecodedMessageResult(null, decodedMessage.senderAddress, false, null)
            }
        }

        // Save message to mmkv
        contentToSave?.let {
            saveMessageToStorage(
                appContext = appContext,
                account = xmtpClient.address,
                decodedMessage = decodedMessage,
                content = it,
                contentType = contentType,
                sentViaConverse = sentViaConverse,
                referencedMessageId = referencedMessageId
            )
        }

        return DecodedMessageResult(contentToReturn, decodedMessage.senderAddress, forceIgnore, decodedMessage.id)
    } catch (e: Exception) {
        val errorType = contentType.split("/").lastOrNull() ?: "UNKNOWN"
        sentryTrackMessage("NOTIFICATION_${errorType}_ERROR", mapOf("error" to e, "topic" to decodedMessage.topic))
        println("[NotificationExtension] ERROR WHILE HANDLING $contentType $e")
        return DecodedMessageResult(null, null, false, null)
    }
}

fun getContentTypeString(contentType: Content.ContentTypeId): String {
    return "${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}"
}

fun saveMessageToStorage(appContext: Context, account: String, decodedMessage: DecodedMessage, content: String, contentType: String, sentViaConverse: Boolean, referencedMessageId: String?) {
    val mmkv = getMmkv(appContext)
    val currentSavedMessagesString = mmkv?.decodeString("saved-notifications-messages")
    Log.d("PushNotificationsService", "Got current saved messages from storage: $currentSavedMessagesString")
    var currentSavedMessages = listOf<SavedNotificationMessage>()
    try {
        currentSavedMessages = Klaxon().parseArray<SavedNotificationMessage>(currentSavedMessagesString ?: "[]") ?: listOf()
    } catch (error: Exception) {
        Log.d("PushNotificationsService", "Could not parse saved messages from storage: $currentSavedMessagesString - $error")
    }
    if (content.isEmpty()) {
        return;
    }
    val newMessageToSave = SavedNotificationMessage(
        topic=decodedMessage.topic,
        content=content,
        senderAddress=decodedMessage.senderAddress,
        sent=decodedMessage.sent.time,
        id=decodedMessage.id,
        sentViaConverse=sentViaConverse,
        contentType=contentType,
        account=account,
        referencedMessageId=referencedMessageId
    )
    currentSavedMessages += newMessageToSave
    val newSavedMessagesString = Klaxon().toJsonString(currentSavedMessages)
    mmkv?.putString("saved-notifications-messages", newSavedMessagesString)
}

fun getJsonRemoteAttachment(remoteAttachment: RemoteAttachment): String {
    try {
        val dictionary =
            mapOf(
                "url" to remoteAttachment!!.url,
                "contentDigest" to remoteAttachment!!.contentDigest,
                "secret" to byteStringToBase64(remoteAttachment!!.secret),
                "salt" to byteStringToBase64(remoteAttachment!!.salt),
                "nonce" to byteStringToBase64(remoteAttachment!!.nonce),
                "scheme" to remoteAttachment!!.scheme,
                "contentLength" to (remoteAttachment!!.contentLength ?: 0),
                "filename" to (remoteAttachment!!.filename ?: "")
            )
        return JSONObject(dictionary).toString()
    } catch (e: Exception) {
        println("Error converting dictionary to JSON string: ${e.localizedMessage}")
        return "";
    }
}

fun getJsonReaction(decodedMessage: DecodedMessage): String {
    val reaction: Reaction? = decodedMessage.content()
    return try {
        val dictionary =
            mapOf(
                "action" to (reaction?.action?.javaClass?.simpleName?.lowercase() ?: ""),
                "schema" to (reaction?.schema?.javaClass?.simpleName?.lowercase() ?: ""),
                "content" to (reaction?.content ?: ""),
                "reference" to (reaction?.reference ?: ""),
            )
        JSONObject(dictionary).toString()
    } catch (e: Exception) {
        println("Error converting dictionary to JSON string: ${e.localizedMessage}")
        "";
    }
}

fun computeSpamScore(address: String, message: String?, sentViaConverse: Boolean, contentType: String, apiURI: String?, appContext: Context): Double {
    var spamScore = runBlocking {
        getSenderSpamScore(appContext, address, apiURI);
    }
    if (contentType.startsWith("xmtp.org/text:") && message?.let { containsURL(it) } == true) {
        spamScore += 1
    }
    if (sentViaConverse) {
        spamScore -= 1
    }
    return spamScore
}

suspend fun getSenderSpamScore(appContext: Context, address: String, apiURI: String?): Double {
    val senderSpamScoreURI = "$apiURI/api/spam/senders/batch"
    val params: MutableMap<String?, Any> = HashMap()
    params["sendersAddresses"] = arrayOf(address);

    val parameters = JSONObject(params as Map<*, *>?)

    return suspendCancellableCoroutine { continuation ->
        val jsonRequest = JsonObjectRequest(Request.Method.POST, senderSpamScoreURI, parameters, {
            Log.d("PushNotificationsService", "SPAM SCORE SUCCESS ${it[address]}")
            var result = 0.0;
            if (it.has(address)){
                result = (it[address] as Int).toDouble()
            }
            continuation.resume(result)

        }) { error ->
            error.printStackTrace()
            continuation.resumeWithException(error)
            Log.d("PushNotificationsService", "SPAM SCORE ERROR - $error")
        }

        Volley.newRequestQueue(appContext).add(jsonRequest)
    }

}
