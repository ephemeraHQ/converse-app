package com.converse.dev.xmtp

import android.content.Context
import android.util.Log
import com.beust.klaxon.Klaxon
import com.converse.dev.*
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.DecodedMessage
import org.xmtp.android.library.codecs.Reaction
import org.xmtp.android.library.codecs.RemoteAttachment
import org.xmtp.android.library.codecs.decoded
import org.xmtp.android.library.messages.Envelope
import org.xmtp.proto.message.contents.Content

fun handleNewMessageNotification(appContext: Context, xmtpClient: Client, envelope: Envelope, remoteMessage: RemoteMessage, sentViaConverse: Boolean): Triple<String, String, RemoteMessage>? {
    val conversation = getPersistedConversation(xmtpClient, envelope.contentTopic)
    if (conversation === null) {
        Log.d("PushNotificationsService", "No conversation found for ${envelope.contentTopic}")
        return null
    }

    val decodedMessage = conversation.decode(envelope)
    Log.d("PushNotificationsService", "Successfully decoded message incoming message")
    val contentType = getContentTypeString(decodedMessage.encodedContent.type)
    var notificationMessage = "New message";
    if (contentType.startsWith("xmtp.org/text:")) {
        notificationMessage = decodedMessage.body;
        saveMessageToStorage(appContext, xmtpClient.address, envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
    } else if (contentType.startsWith("xmtp.org/remoteStaticAttachment:")) {
        notificationMessage = "\uD83D\uDCCE Media";
        saveMessageToStorage(appContext, xmtpClient.address, envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
    } else if (contentType.startsWith("xmtp.org/reaction:")) {
        val reaction: Reaction? = decodedMessage.content()
        saveMessageToStorage(appContext, xmtpClient.address, envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
        if (reaction?.action.toString() == "removed") {
            return null;
        } else if (reaction == null || reaction?.schema.toString() != "unicode") {
            notificationMessage = "Reacted to a message";
        } else {
            notificationMessage = "Reacted ${reaction.content} to a message"
        }
    } else {
        Log.d("PushNotificationsService", "Unknown content type")
    }
    if (decodedMessage.senderAddress == xmtpClient.address) return null
    var title = getSavedConversationTitle(appContext, envelope.contentTopic)
    if (title == "") {
        title = shortAddress(decodedMessage.senderAddress)
    }

    if (hasForbiddenPattern(decodedMessage.senderAddress)) {
        return null
    }

    return Triple(title, notificationMessage, remoteMessage)
}

fun getContentTypeString(contentType: Content.ContentTypeId): String {
    return "${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}"
}

fun saveMessageToStorage(appContext: Context, account: String, topic: String, decodedMessage: DecodedMessage, sentViaConverse: Boolean, contentType: String) {
    val mmkv = getMmkv(appContext)
    val currentSavedMessagesString = mmkv?.decodeString("saved-notifications-messages")
    Log.d("PushNotificationsService", "Got current saved messages from storage: $currentSavedMessagesString")
    var currentSavedMessages = listOf<SavedNotificationMessage>()
    try {
        currentSavedMessages = Klaxon().parseArray<SavedNotificationMessage>(currentSavedMessagesString ?: "[]") ?: listOf()
    } catch (error: Exception) {
        Log.d("PushNotificationsService", "Could not parse saved messages from storage: $currentSavedMessagesString - $error")
    }
    var messageBody = "";
    if (contentType.startsWith("xmtp.org/text:")) {
        messageBody = decodedMessage.body;
    } else if (contentType.startsWith("xmtp.org/remoteStaticAttachment:")) {
        messageBody = getJsonRemoteAttachment(decodedMessage);
    } else if (contentType.startsWith("xmtp.org/reaction:")) {
        messageBody = getJsonReaction(decodedMessage);
    }
    if (messageBody.isEmpty()) {
        return;
    }
    val newMessageToSave = SavedNotificationMessage(
        topic=topic,
        content=messageBody,
        senderAddress=decodedMessage.senderAddress,
        sent=decodedMessage.sent.time,
        id=decodedMessage.id,
        sentViaConverse=sentViaConverse,
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
    val reactionContent = reaction?.content ?: "";
    return try {
        val dictionary =
            mapOf(
                "reference" to (reaction?.reference ?: ""),
                "action" to (reaction?.action.toString() ?: ""),
                "content" to (reaction?.content ?: ""),
                "schema" to (reaction?.schema.toString() ?: ""),
            )
        JSONObject(dictionary).toString()
    } catch (e: Exception) {
        println("Error converting dictionary to JSON string: ${e.localizedMessage}")
        "";
    }
}

fun computeSpamScore(address: String, message: String?, sentViaConverse: Boolean, contentType: String): Double {
    var spamScore = 0.0
    // Spam checking rules
    message?.let {
        if (containsURL(it)) {
            spamScore += 1
        }
    }
    if (sentViaConverse) {
        spamScore -= 1
    }
    return spamScore
}
