package com.converse.xmtp

import android.content.Context
import android.util.Log
import com.beust.klaxon.Klaxon

import com.converse.*
import com.converse.PushNotificationsService.Companion.TAG
import com.google.firebase.messaging.RemoteMessage
import computeSpamScoreDmWelcome
import computeSpamScoreGroupMessage
import computeSpamScoreGroupWelcome
import isConversationAllowed
import isConversationBlocked

import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.DecodedMessage
import org.xmtp.android.library.codecs.Reaction
import org.xmtp.android.library.codecs.RemoteAttachment
import org.xmtp.android.library.codecs.Reply
import org.xmtp.proto.message.api.v1.MessageApiOuterClass

import org.xmtp.proto.message.contents.Content


data class NotificationDataResult(
    val title: String = "",
    val subtitle: String? = null,
    val body: String = "",
    val remoteMessage: RemoteMessage? = null,
    val messageId: String? = null,
    val shouldShowNotification: Boolean = false,
    val avatar: String? = null,
    val isGroup: Boolean = false
)

data class DecodedMessageResult(
    val content: String? = null,
    val senderAddress: String? = null,
    val forceIgnore: Boolean = false,
    val id: String? = null
)

suspend fun handleV3Message(
    appContext: Context,
    xmtpClient: Client,
    envelope: MessageApiOuterClass.Envelope,
    remoteMessage: RemoteMessage,
): NotificationDataResult {
    val conversation = xmtpClient.findConversationByTopic(envelope.contentTopic)
    if (conversation == null) {
        Log.d("PushNotificationsService", "No conversation found for ${envelope.contentTopic}")
        return NotificationDataResult()
    }
    sentryTrackMessage(
        "[NotificationExtension] Found conversation",
        mapOf()
    )

    conversation.sync()

    sentryTrackMessage(
        "[NotificationExtension] Done syncing group",
        mapOf()
    )

    val decodedMessage = conversation.processMessage(envelope.message.toByteArray()).decode()
    when (conversation) {
        is Conversation.Group -> {
            // Handle the Group case
            return handleGroupMessage(appContext, conversation, decodedMessage, xmtpClient, remoteMessage)
        }
        is Conversation.Dm -> {
            // Handle the Dm case
            return handleDmMessage(appContext, conversation, decodedMessage, xmtpClient, remoteMessage)
        }
    }
}

suspend fun handleDmMessage(
    appContext: Context,
    conversation: Conversation.Dm,
    decodedMessage: DecodedMessage,
    xmtpClient: Client,
    remoteMessage: RemoteMessage
): NotificationDataResult {
// For now, use the conversation member linked address as "senderAddress"
    val dm = conversation.dm
    // @todo => make inboxId a first class citizen
    dm.members().firstOrNull { it.inboxId == decodedMessage.senderAddress }?.addresses?.get(0)?.let { senderAddress ->
        decodedMessage.senderAddress = senderAddress
    }
    var conversationTitle = ""

    val decodedMessageResult = handleMessageByContentType(
        appContext,
        decodedMessage,
        xmtpClient,
    )

    decodedMessageResult.senderAddress?.let {
        conversationTitle = shortAddress(it)
    }

    val senderProfile =
        decodedMessageResult.senderAddress?.let { getProfile(appContext, xmtpClient.address, it) }
    var senderAvatar: String? = null
    senderProfile?.let { senderProfile ->
        conversationTitle = getPreferredName(address = decodedMessageResult.senderAddress, socials = senderProfile.socials)
        senderAvatar = getPreferredAvatar(socials = senderProfile.socials)
    }

    val shouldShowNotification = if (decodedMessageResult.senderAddress != xmtpClient.address && !decodedMessageResult.forceIgnore && decodedMessageResult.content != null) {
        if ((conversationTitle == null || conversationTitle!!.isEmpty()) && decodedMessageResult.senderAddress != null) {
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
        shouldShowNotification = shouldShowNotification,
        avatar = senderAvatar
    )
}

suspend fun handleGroupMessage(
    appContext: Context,
    convoGroup: Conversation.Group,
    decodedMessage: DecodedMessage,
    xmtpClient: Client,
    remoteMessage: RemoteMessage
): NotificationDataResult {
// For now, use the conversation member linked address as "senderAddress"
    val group = convoGroup.group
    // @todo => make inboxId a first class citizen
    group.members().firstOrNull { it.inboxId == decodedMessage.senderAddress }?.addresses?.get(0)?.let { senderAddress ->
        decodedMessage.senderAddress = senderAddress
    }
    val decodedMessageResult = handleMessageByContentType(
        appContext,
        decodedMessage,
        xmtpClient,
    )

    var shouldShowNotification = if (decodedMessageResult.senderAddress?.lowercase() != xmtpClient.inboxId.lowercase() && decodedMessageResult.senderAddress?.lowercase() != xmtpClient.address.lowercase() && !decodedMessageResult.forceIgnore && decodedMessageResult.content != null) {
        true
    } else {
        Log.d(TAG, "[NotificationExtension] Not showing a notification")
        false
    }

    var subtitle: String? = null

    if (shouldShowNotification) {
        val mmkv = getMmkv(appContext)
        var apiURI = mmkv?.decodeString("api-uri")
        if (apiURI == null) {
            apiURI = getAsyncStorage("api-uri")
        }
        val spamScore = computeSpamScoreGroupMessage(xmtpClient, group, decodedMessage, apiURI)
        if (spamScore < 0) {
            // Message is going to main inbox
            // We replaced decodedMessage.senderAddress from inboxId to actual address
            // so it appears well in the app until inboxId is a first class citizen
            val senderProfile = getProfile(appContext, xmtpClient.address, decodedMessage.senderAddress)
            senderProfile?.let { senderProfile ->
                subtitle = getPreferredName(decodedMessage.senderAddress, senderProfile.socials)
            }
        } else if (spamScore == 0) { // Message is Request
          shouldShowNotification = false
        } else { // Message is Spam
          shouldShowNotification = false
        }
    }

    return NotificationDataResult(
        title = group.name,
        subtitle = subtitle,
        body = decodedMessageResult.content ?: "",
        remoteMessage = remoteMessage,
        messageId = decodedMessageResult.id,
        shouldShowNotification = shouldShowNotification,
        isGroup = true,
        avatar = group.imageUrlSquare
    )
}

fun handleMessageByContentType(
    appContext: Context,
    decodedMessage: DecodedMessage,
    xmtpClient: Client,
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
                forceIgnore = action == "removed" || (isV3MessageTopic(decodedMessage.topic) && referencedMessageId !== null && !isGroupMessageFromMe(xmtpClient, referencedMessageId))
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

fun saveMessageToStorage(appContext: Context, account: String, decodedMessage: DecodedMessage, content: String, contentType: String, referencedMessageId: String?) {
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


suspend fun handleV3Welcome(
    appContext: Context,
    xmtpClient: Client,
    conversation: Conversation,
    remoteMessage: RemoteMessage
): NotificationDataResult {
    var shouldShowNotification = false
    try {
        val mmkv = getMmkv(appContext)
        var apiURI = mmkv?.decodeString("api-uri")
        if (apiURI == null) {
            apiURI = getAsyncStorage("api-uri")
        }
        xmtpClient.syncConsent()
        val consentList = xmtpClient.preferences.consentList
        var spamScore = 1.0
        when (conversation) {
            is Conversation.Group -> {
                // Handle the Group case
                spamScore =
                    computeSpamScoreGroupWelcome(appContext, xmtpClient, conversation.group, apiURI)
            }

            is Conversation.Dm -> {
                // Handle the Dm case
                spamScore = computeSpamScoreDmWelcome(
                    appContext,
                    xmtpClient,
                    conversation.dm,
                    apiURI
                )
            }
        }
        if (spamScore < 0) { // Message is going to main inbox
            // consent list loaded in computeSpamScoreGroupWelcome
            val groupAllowed = isConversationAllowed(conversation, consentList)
            val groupDenied = isConversationBlocked(conversation, consentList)
            // If group is already consented (either way) then don't show a notification for welcome as this will likely be a second+ installation
            if (!groupAllowed && !groupDenied) {
                shouldShowNotification = true
            } else {
                shouldShowNotification = false
            }
        } else if (spamScore == 0.0) { // Message is Request
            shouldShowNotification = false
            // @todo : trackNewRequest()
        } else { // Message is Spam
            shouldShowNotification = false
        }
    } catch (e: Exception) {

    }
    conversation.sync()
    when (conversation) {
        is Conversation.Group -> {
            // Handle the Group case
            return NotificationDataResult(
                title = conversation.group.name,
                body = "You have been added to a new group",
                remoteMessage = remoteMessage,
                messageId = "welcome-${conversation.topic}",
                shouldShowNotification = shouldShowNotification
            )
        }
        is Conversation.Dm -> {
            // TODO:
            // Handle the Dm case
            return NotificationDataResult(
                title = conversation.dm.peerInboxId,
                body = "You have a new DM",
                remoteMessage = remoteMessage,
                messageId = "welcome-${conversation.topic}",
                shouldShowNotification = shouldShowNotification
            )
        }
    }

}

fun isGroupMessageFromMe(xmtpClient: Client, messageId: String): Boolean {
    try {
        val message = xmtpClient.findMessage(messageId)
        return message?.decodeOrNull()?.senderAddress == xmtpClient.inboxId;
    } catch (e: Exception) {
        return false
    }
}
