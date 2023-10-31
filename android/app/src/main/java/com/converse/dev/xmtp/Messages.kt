package com.converse.dev.xmtp

import android.content.Context
import android.util.Log
import com.beust.klaxon.Klaxon
import com.converse.dev.*
import com.converse.dev.PushNotificationsService.Companion.TAG
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.delay
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.DecodedMessage
import org.xmtp.android.library.codecs.Reaction
import org.xmtp.android.library.codecs.RemoteAttachment
import org.xmtp.android.library.codecs.decoded
import org.xmtp.android.library.messages.Envelope
import org.xmtp.proto.message.api.v1.MessageApiOuterClass
import org.xmtp.proto.message.contents.Content

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

                val spamScore = computeSpamScore(
                    address = conversation.peerAddress,
                    message = messageContent,
                    sentViaConverse = message.sentViaConverse,
                    contentType = contentType
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
                }

                val decodedMessageResult = handleMessageByContentType(
                    appContext,
                    message,
                    xmtpClient
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
                    val mmkv = getMmkv(appContext)
                    var apiURI = mmkv?.decodeString("api-uri")
                    if (apiURI == null) {
                        apiURI = getAsyncStorage("api-uri")
                    }
                    val pushToken = getKeychainValue("PUSH_TOKEN")

                    if (apiURI != null && pushToken !== null) {
                        Log.d(TAG, "Subscribing to new topic at api: $apiURI")
                        subscribeToTopic(appContext, apiURI, xmtpClient.address, pushToken, conversation.topic)
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
    remoteMessage: RemoteMessage
): NotificationDataResult {
    val conversation = getPersistedConversation(xmtpClient, envelope.contentTopic)
        ?: run {
            Log.d("PushNotificationsService", "No conversation found for ${envelope.contentTopic}")
            return NotificationDataResult()
        }

    val message = conversation.decode(envelope)
    val contentTopic = envelope.contentTopic
    var conversationTitle = getSavedConversationTitle(appContext, contentTopic)
    var conversationContext: ConversationContext? = null

    if (conversation is Conversation.V2 && conversation.conversationV2.context.conversationId !== null) {
        conversationContext = ConversationContext(
            conversation.conversationV2.context.conversationId,
            conversation.conversationV2.context.metadataMap
        )
    }

    val decodedMessageResult = handleMessageByContentType(
        appContext,
        message,
        xmtpClient
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
): DecodedMessageResult {
    val contentType = getContentTypeString(decodedMessage.encodedContent.type)
    var contentToReturn: String?
    var contentToSave: String?
    var forceIgnore = false

    try {
        when {
            contentType.startsWith("xmtp.org/text:") -> {
                contentToSave = decodedMessage.body
                contentToReturn = contentToSave
            }

            contentType.startsWith("xmtp.org/remoteStaticAttachment:") -> {
                contentToSave = getJsonRemoteAttachment(decodedMessage)
                contentToReturn = "📎 Media"
            }

            contentType.startsWith("xmtp.org/reaction:") -> {
                val reaction: Reaction? = decodedMessage.content()
                val action = reaction?.action?.javaClass?.simpleName?.lowercase()
                val schema = reaction?.schema?.javaClass?.simpleName?.lowercase()
                val content = reaction?.content
                forceIgnore = action == "removed"
                contentToSave = getJsonReaction(decodedMessage)
                contentToReturn = when {
                    action != "removed" && schema == "unicode" && content != null -> "Reacted $content to a message"
                    else -> "Reacted to a message"
                }
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
                contentType = contentType
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

fun saveMessageToStorage(appContext: Context, account: String, decodedMessage: DecodedMessage, content: String, contentType: String) {
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
        sentViaConverse=decodedMessage.sentViaConverse,
        contentType=contentType,
        account=account
    )
    currentSavedMessages += newMessageToSave
    val newSavedMessagesString = Klaxon().toJsonString(currentSavedMessages)
    mmkv?.putString("saved-notifications-messages", newSavedMessagesString)
}

fun getJsonRemoteAttachment(decodedMessage: DecodedMessage): String {
    val remoteAttachment =
        decodedMessage.encodedContent.decoded<RemoteAttachment>() ?: return "";
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

fun computeSpamScore(address: String, message: String?, sentViaConverse: Boolean, contentType: String): Double {
    var spamScore = 0.0
    if (contentType.startsWith("xmtp.org/text:") && message?.let { containsURL(it) } == true) {
        spamScore += 1
    }
    if (sentViaConverse) {
        spamScore -= 1
    }
    return spamScore
}
