package com.converse.dev

import android.app.ActivityManager
import android.util.Log
import android.view.View
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.beust.klaxon.Klaxon
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeArray
import com.google.crypto.tink.subtle.Base64
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.google.protobuf.ByteString
import com.reactnativecommunity.asyncstorage.AsyncStorageModule
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.ViewManager
import expo.modules.core.arguments.MapArguments
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.SingletonModule
import expo.modules.notifications.notifications.JSONNotificationContentBuilder
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.encodedInBase64
import expo.modules.securestore.SecureStoreModule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.xmtp.android.library.*
import org.xmtp.android.library.messages.Envelope
import org.xmtp.android.library.messages.EnvelopeBuilder
import org.xmtp.android.library.messages.PrivateKeyBundleV1Builder
import java.security.MessageDigest
import java.util.*
import kotlinx.coroutines.*
import org.xmtp.android.library.codecs.AttachmentCodec
import org.xmtp.android.library.codecs.RemoteAttachment
import org.xmtp.android.library.codecs.RemoteAttachmentCodec
import org.xmtp.android.library.codecs.decoded
import org.xmtp.proto.message.contents.Content
import kotlin.coroutines.resume

class NotificationData(val message: String, val timestampNs: String, val contentTopic: String, val sentViaConverse: Boolean? = false)
class ConversationDictData(val shortAddress: String? = null, val lensHandle: String? = null, val ensName: String? = null, val title: String? = null)
class SavedNotificationMessage(val topic: String, val content: String, val senderAddress: String, val sent: Long, val id: String, val sentViaConverse: Boolean, val contentType: String)
class ConversationContext(val conversationId: String, val metadata: Map<String, Any>)
class ConversationV2Data(val version: String = "v2", val topic: String, val peerAddress: String, val createdAt: String, val context: ConversationContext?, val keyMaterial: String)

fun shortAddress(input: String): String {
    if (input.length > 6) {
        val start = 4
        val end = input.lastIndex - 3
        return input.replaceRange(start, end, "...")
    }
    return input
}

internal class PromiseWrapper (private val mPromise: com.facebook.react.bridge.Promise) :
    Promise {
    override fun resolve(value: Any?) {
        mPromise.resolve(value.toString())
    }

    override fun reject(code: String, message: String, e: Throwable) {
        mPromise.reject(code, message, e)
    }
}

fun isInviteTopic(topic: String): Boolean {
    return topic.startsWith("/xmtp/0/invite-")
}

fun isIntroTopic(topic: String): Boolean {
    return topic.startsWith("/xmtp/0/intro-")
}

class PushNotificationsService : FirebaseMessagingService() {
    companion object {
        private const val TAG = "PushNotificationsService"
        internal const val NOTIFICATION_CHANNEL_ID = "default"
        private lateinit var secureStoreModule: SecureStoreModule
        private lateinit var asyncStorageModule: AsyncStorageModule
    }

    override fun onCreate() {
        super.onCreate()
        initSecureStore()
        initAsyncStorage()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Client.register(codec = AttachmentCodec())
        Client.register(codec = RemoteAttachmentCodec())
        var xmtpClient = initXmtpClient()
        if (applicationInForeground()) {
            Log.d(TAG, "App is in foreground, dropping")
            return
        }
        Log.d(TAG, "Received a notification")

        // Check if message contains a data payload.
        if (remoteMessage.data.isEmpty()) return
        Log.d(TAG, "Message data payload: ${remoteMessage.data["body"]}")

        val envelopeJSON = remoteMessage.data["body"]
        if (envelopeJSON === null || envelopeJSON.isEmpty()) return

        val notificationData = Klaxon().parse<NotificationData>(envelopeJSON)
        if (notificationData === null) return
        Log.d(TAG, "Decoded notification data: topic is ${notificationData.contentTopic}")

        val encryptedMessageData = Base64.decode(notificationData.message, Base64.NO_WRAP)
        val envelope = EnvelopeBuilder.buildFromString(notificationData.contentTopic, Date(notificationData.timestampNs.toLong()/1000000), encryptedMessageData)
        val sentViaConverse = notificationData.sentViaConverse!!

        if (isIntroTopic(notificationData.contentTopic)) {
            return
        } else if (isInviteTopic(notificationData.contentTopic)) {
            Log.d(TAG, "Handling a new conversation notification")
            handleNewConversationV2Notification(xmtpClient, envelope, remoteMessage)
        } else {
            Log.d(TAG, "Handling a new message notification")
            handleNewMessageNotification(xmtpClient, envelope, remoteMessage, sentViaConverse)
        }

    }

    private fun handleNewConversationV2Notification(xmtpClient:Client, envelope: Envelope, remoteMessage: RemoteMessage) {
        val conversation = xmtpClient.conversations.fromInvite((envelope))
        Log.d(TAG, "Decoded new conversation from invite")
        val conversationV2Data = ConversationV2Data(
            "v2",
            conversation.topic,
            conversation.peerAddress,
            conversation.createdAt.toString(),
            null,
            Base64.encode(conversation.keyMaterial)
        )
        val apiURI = getAsyncStorage("api-uri")
        val expoPushToken = getKeychainValue("EXPO_PUSH_TOKEN")
        if (apiURI != null) {
            Log.d(TAG, "Subscribing to new topic at api: $apiURI")
            subscribeToTopic(apiURI, expoPushToken, conversation.topic)
        }
        persistNewConversation(conversation.topic, conversationV2Data)
        showNotification(shortAddress(conversation.peerAddress), "New Conversation", remoteMessage)
    }

    private fun subscribeToTopic(apiURI: String, expoPushToken: String, topic: String) {
        val appendTopicURI = "$apiURI/api/subscribe/append"
        val params: MutableMap<String?, String?> = HashMap()
        params["topic"] = topic
        params["expoToken"] = expoPushToken

        val parameters = JSONObject(params as Map<*, *>?)

        val jsonRequest = JsonObjectRequest(Request.Method.POST, appendTopicURI, parameters, {
            //TODO: handle success
            Log.d(TAG, "Subscribe to new topic success!")
        }) { error ->
            error.printStackTrace()
            //TODO: handle failure
            Log.d(TAG, "Subscribe to new topic error - $error")
        }

        Volley.newRequestQueue(this).add(jsonRequest)
    }

    private fun handleNewMessageNotification(xmtpClient: Client, envelope: Envelope, remoteMessage: RemoteMessage, sentViaConverse: Boolean) {
        val conversation = getPersistedConversation(xmtpClient, envelope.contentTopic)
        if (conversation === null) {
            Log.d(TAG, "No conversation found for ${envelope.contentTopic}")
            return
        }

        val decodedMessage = conversation.decode(envelope)
        Log.d(TAG, "Successfully decoded message incoming message")
        val contentType = getContentTypeString(decodedMessage.encodedContent.type)
        var notificationMessage = "New message";
        if (contentType.startsWith("xmtp.org/text:")) {
            notificationMessage = decodedMessage.body;
            saveMessageToStorage(envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
        } else if (contentType.startsWith("xmtp.org/remoteStaticAttachment:")) {
            notificationMessage = "\uD83D\uDCCE Media";
            saveMessageToStorage(envelope.contentTopic, decodedMessage, sentViaConverse, contentType)
        } else if (contentType.startsWith("xmtp.org/reaction:")) {
            notificationMessage = "Reacted to a message";
        } else {
            Log.d(TAG, "Unknown content type")
        }
        if (decodedMessage.senderAddress == xmtpClient.address) return
        var title = getSavedConversationTitle(envelope.contentTopic)
        if (title == "") {
            title = shortAddress(decodedMessage.senderAddress)
        }

        showNotification(title, notificationMessage, remoteMessage)
    }

    private fun getContentTypeString(contentType: Content.ContentTypeId): String {
        return "${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}"
    }

    private fun saveMessageToStorage(topic: String, decodedMessage: DecodedMessage, sentViaConverse: Boolean, contentType: String) {
        val currentSavedMessagesString = getAsyncStorage("saved-notifications-messages")
        Log.d(TAG, "Got current saved messages from storage: $currentSavedMessagesString")
        var currentSavedMessages = listOf<SavedNotificationMessage>()
        try {
            currentSavedMessages = Klaxon().parseArray<SavedNotificationMessage>(currentSavedMessagesString ?: "[]") ?: listOf()
        } catch (error: Exception) {
            Log.d(TAG, "Could not parse saved messages from storage: $currentSavedMessagesString - $error")
        }
        var messageBody = "";
        if (contentType.startsWith("xmtp.org/text:")) {
            messageBody = decodedMessage.body;
        } else if (contentType.startsWith("xmtp.org/remoteStaticAttachment:")) {
            messageBody = getJsonRemoteAttachment(decodedMessage);
        }
        if (messageBody.isEmpty()) {
            return;
        }
        val newMessageToSave = SavedNotificationMessage(
            topic,
            messageBody,
            decodedMessage.senderAddress,
            decodedMessage.sent.time,
            decodedMessage.id,
            sentViaConverse,
            contentType
        )
        currentSavedMessages += newMessageToSave
        val newSavedMessagesString = Klaxon().toJsonString(currentSavedMessages)
        setAsyncStorage("saved-notifications-messages", newSavedMessagesString)
    }

    private fun byteStringToBase64(bs: ByteString): String {
        return Base64.encode(bs.toByteArray())
    }

    private fun getJsonRemoteAttachment(decodedMessage: DecodedMessage): String {
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


    private fun getKeychainValue(key: String) = runBlocking {
        val argumentsMap = mutableMapOf<String, Any>()
        Log.d(TAG, "Current package is $packageName")
        argumentsMap["keychainService"] = packageName

        val arguments = MapArguments(argumentsMap)

        var promiseResult: Any? = null;

        val promise = PromiseImpl({ result: Array<Any?>? -> promiseResult = result?.get(0) }, { error: Array<Any?>? -> })
        val promiseWrapped = PromiseWrapper(promise)
        withContext(Dispatchers.Default) {
            secureStoreModule.getValueWithKeyAsync(key, arguments, promiseWrapped)
        }
        return@runBlocking promiseResult as String
    }

    private fun setKeychainValue(key: String, value: String) = runBlocking {
        val argumentsMap = mutableMapOf<String, Any>()
        argumentsMap["keychainService"] = packageName

        val arguments = MapArguments(argumentsMap)

        var promiseResult: Any? = null;

        val promise = PromiseImpl({ result: Array<Any?>? -> promiseResult = result?.get(0) }, { error: Array<Any?>? -> })
        val promiseWrapped = PromiseWrapper(promise)
        withContext(Dispatchers.Default) {
            secureStoreModule.setValueWithKeyAsync(value, key, arguments, promiseWrapped)
        }
        return@runBlocking promiseResult as String
    }


    private fun getAsyncStorage(key: String): String? {
        val storageArguments = Arguments.createArray()
        storageArguments.pushString(key)

        var value = ""

        runBlocking {
            suspendCancellableCoroutine<Unit> { continuation ->
                // Call the suspend function and pass in a lambda that resumes the coroutine when the callback is called
                asyncStorageModule.multiGet(storageArguments) { result ->
                    try {
                        value =
                            ((result[1] as WritableNativeArray).toArrayList()[0] as ArrayList<String>)[1]
                        continuation.resume(Unit)
                    } catch (e: Exception) {
                        Log.d(TAG, "Could not read AsyncStorage value : $e")
                        continuation.resume(Unit)
                    }
                }
            }
        }
        return value
    }

    private fun setAsyncStorage(key: String, value: String) {
        val storageArguments = Arguments.createArray()
        val valueArguments = Arguments.createArray()
        valueArguments.pushString(key)
        valueArguments.pushString(value)
        storageArguments.pushArray(valueArguments)
        runBlocking {
            suspendCancellableCoroutine<Unit> { continuation ->
                // Call the suspend function and pass in a lambda that resumes the coroutine when the callback is called
                asyncStorageModule.multiSet(storageArguments) { _ ->
                    try {
                        continuation.resume(Unit)
                    } catch (e: Exception) {
                        Log.d(TAG, "Could not set AsyncStorage value : $e")
                        continuation.resume(Unit)
                    }
                }
            }
        }
    }

    private fun getNotificationIdentifier(remoteMessage: RemoteMessage): String {
        return remoteMessage.data?.get("tag") ?: remoteMessage.messageId ?: UUID.randomUUID().toString()
    }

    private fun createNotificationRequest(
        identifier: String,
        content: NotificationContent,
        notificationTrigger: FirebaseNotificationTrigger
    ): NotificationRequest {
        return NotificationRequest(identifier, content, notificationTrigger)
    }

    private fun createNotificationFromRemoteMessage(title: String, message: String, remoteMessage: RemoteMessage): Notification {
        val identifier = getNotificationIdentifier(remoteMessage)
        var data = remoteMessage.data as MutableMap<Any, Any>
        data["title"] = title
        data["message"] = message
        val payload = JSONObject(data as Map<*, *>)
        val content = JSONNotificationContentBuilder(this).setPayload(payload).build()
        val request = createNotificationRequest(identifier, content, FirebaseNotificationTrigger(remoteMessage))
        return Notification(request, Date(remoteMessage.sentTime))
    }

    private fun showNotification(title: String, message: String, remoteMessage: RemoteMessage) {
        NotificationsService.receive(this, createNotificationFromRemoteMessage(title, message, remoteMessage))
    }

    private fun initXmtpClient(): Client {
        val xmtpBase64KeyString = getKeychainValue("XMTP_BASE64_KEY")
        if (xmtpBase64KeyString == null || xmtpBase64KeyString.isEmpty()) {
            Log.d(TAG, "No XMTP Base 64 Key found")
        } else {
            Log.d(TAG, "Got XMTP Base 64 Key")
        }
        val keys = PrivateKeyBundleV1Builder.buildFromBundle(Base64.decode(xmtpBase64KeyString))
        val xmtpEnvString = getAsyncStorage("xmtp-env")
        val xmtpEnv =
            if (xmtpEnvString == "production") XMTPEnvironment.PRODUCTION else XMTPEnvironment.DEV

        val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true))

        return Client().buildFrom(bundle = keys, options = options)
    }

    private fun getPersistedConversation(xmtpClient: Client, topic: String): Conversation? {
        try {
            val topicBytes = topic.toByteArray(Charsets.UTF_8)
            val digest = MessageDigest.getInstance("SHA-256").digest(topicBytes)
            val encodedTopic = digest.joinToString("") { "%02x".format(it) }
            var persistedConversationData = getKeychainValue("XMTP_CONVERSATION_$encodedTopic")

            return xmtpClient.importConversation(persistedConversationData.toByteArray())
        } catch (e: Exception) {
            Log.d(TAG, "Could not retrieve conversation: $e")
        }
        return null
    }

    private fun persistNewConversation(topic: String, conversationV2Data: ConversationV2Data) {
        try {
            val topicBytes = topic.toByteArray(Charsets.UTF_8)
            val digest = MessageDigest.getInstance("SHA-256").digest(topicBytes)
            val encodedTopic = digest.joinToString("") { "%02x".format(it) }
            setKeychainValue("XMTP_CONVERSATION_$encodedTopic", Klaxon().toJsonString(conversationV2Data))
        } catch (e: Exception) {
            Log.d(TAG, "Could not persist conversation: $e")
        }
    }

    private fun getSavedConversationTitle(topic: String): String {
        val savedConversationDict = getAsyncStorage("conversation-$topic") ?: return ""
        val parsedConversationDict = Klaxon().parse<ConversationDictData>(savedConversationDict)
        // Keeping lensHandle & ensName for now but let's delete them soon
        // and keep only title
        return (((parsedConversationDict?.title ?: parsedConversationDict?.lensHandle) ?: parsedConversationDict?.ensName) ?: parsedConversationDict?.shortAddress) ?: ""
    }

    private fun applicationInForeground(): Boolean {
        val activityManager: ActivityManager = getSystemService(ACTIVITY_SERVICE) as ActivityManager
        val services: List<ActivityManager.RunningAppProcessInfo> =
            activityManager.runningAppProcesses
        var isActivityFound = false
        if (services[0].processName
                .equals(packageName, ignoreCase = true) && services[0].importance === ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
        ) {
            isActivityFound = true
        }
        return isActivityFound
    }

    private fun initSecureStore() {
        val reactContext = ReactApplicationContext(this)
        secureStoreModule = SecureStoreModule(reactContext)
        val internalModules: Collection<InternalModule> = listOf()
        val exportedModules: Collection<ExportedModule> = listOf()
        val viewManagers: Collection<ViewManager<View>> = listOf()
        val singletonModules: Collection<SingletonModule> = listOf()

        val moduleRegistry = ModuleRegistry(internalModules, exportedModules, viewManagers, singletonModules)
        secureStoreModule.onCreate(moduleRegistry)
    }

    private fun initAsyncStorage() {
        val reactContext = ReactApplicationContext(this)
        asyncStorageModule = AsyncStorageModule(reactContext)
    }
}