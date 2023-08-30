package com.converse.dev.xmtp

import android.util.Log
import com.beust.klaxon.Klaxon
import com.converse.dev.*
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.DecodedMessage
import org.xmtp.android.library.codecs.RemoteAttachment
import org.xmtp.android.library.codecs.decoded
import org.xmtp.android.library.messages.Envelope
import org.xmtp.proto.message.contents.Content

fun handleNewMessageNotification(xmtpClient: Client, envelope: Envelope, remoteMessage: RemoteMessage, sentViaConverse: Boolean): Triple<String, String, RemoteMessage>? {
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
        saveMessageToStorage(xmtpClient.address, envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
    } else if (contentType.startsWith("xmtp.org/remoteStaticAttachment:")) {
        notificationMessage = "\uD83D\uDCCE Media";
        saveMessageToStorage(xmtpClient.address, envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
    } else if (contentType.startsWith("xmtp.org/reaction:")) {
        val reactionParameters = decodedMessage.encodedContent.parametersMap;
        saveMessageToStorage(xmtpClient.address, envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
        if (reactionParameters["action"] == "removed") {
            return null;
        } else if (reactionParameters["schema"] != "unicode") {
            notificationMessage = "Reacted to a message";
        } else {
            val reactionContent = decodedMessage.encodedContent.content.toStringUtf8();
            notificationMessage = "Reacted $reactionContent to a message"
        }
    } else {
        Log.d("PushNotificationsService", "Unknown content type")
    }
    if (decodedMessage.senderAddress == xmtpClient.address) return null
    var title = getSavedConversationTitle(envelope.contentTopic)
    if (title == "") {
        title = shortAddress(decodedMessage.senderAddress)
    }

    return Triple(title, notificationMessage, remoteMessage)
}

fun getContentTypeString(contentType: Content.ContentTypeId): String {
    return "${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}"
}

fun saveMessageToStorage(account: String, topic: String, decodedMessage: DecodedMessage, sentViaConverse: Boolean, contentType: String) {
    val currentSavedMessagesString = getAsyncStorage("saved-notifications-messages")
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
    setAsyncStorage("saved-notifications-messages", newSavedMessagesString)
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
    val reactionContent = decodedMessage.encodedContent.content.toStringUtf8();
    val reactionParameters = decodedMessage.encodedContent.parametersMap;
    return try {
        val dictionary =
            mapOf(
                "reference" to reactionParameters["reference"],
                "action" to reactionParameters["action"],
                "content" to reactionContent,
                "schema" to reactionParameters["schema"],
            )
        JSONObject(dictionary).toString()
    } catch (e: Exception) {
        println("Error converting dictionary to JSON string: ${e.localizedMessage}")
        "";
    }
}
