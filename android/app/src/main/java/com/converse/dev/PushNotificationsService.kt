package com.converse.dev

import android.app.ActivityManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import androidx.core.app.NotificationCompat
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.beust.klaxon.Klaxon
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReactApplicationContext
import com.google.crypto.tink.subtle.Base64
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.tencent.mmkv.MMKV
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.ViewManager
import expo.modules.core.arguments.MapArguments
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.SingletonModule
import expo.modules.securestore.SecureStoreModule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.xmtp.android.library.*
import org.xmtp.android.library.messages.Envelope
import org.xmtp.android.library.messages.EnvelopeBuilder
import org.xmtp.android.library.messages.PrivateKeyBundleV1
import java.security.MessageDigest
import java.util.*


class NotificationData(val message: String, val timestampNs: String, val contentTopic: String)
class ConversationDictData(val shortAddress: String? = null, val lensHandle: String? = null, val ensName: String? = null)
class SavedNotificationMessage(val topic: String, val content: String, val senderAddress: String, val sent: Long, val id: String)
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
        private lateinit var xmtpClient: Client
    }

    override fun onCreate() {
        super.onCreate()
        initSecureStore()
        MMKV.initialize(this)
        try {
            initXmtpClient()
        } catch (e: java.lang.Exception) {
            Log.d(TAG, "Could not init XMTP client: $e")
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
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

        if (isIntroTopic(notificationData.contentTopic)) {
            return
        } else if (isInviteTopic(notificationData.contentTopic)) {
            handleNewConversationV2Notification(envelope)
        } else {
            handleNewMessageNotification(envelope)
        }

    }

    private fun handleNewConversationV2Notification(envelope: Envelope) {
        val conversation = xmtpClient.conversations.fromInvite((envelope))
        val conversationV2Data = ConversationV2Data(
            "v2",
            conversation.topic,
            conversation.peerAddress,
            conversation.createdAt.toString(),
            null,
            Base64.encode(conversation.keyMaterial)
        )
        val apiURI = getMMKV("api-uri")
        val expoPushToken = getKeychainValue("EXPO_PUSH_TOKEN")
        if (apiURI != null) {
            subscribeToTopic(apiURI, expoPushToken, conversation.topic)
        }
        persistNewConversation(conversation.topic, conversationV2Data)
        showNotification(conversation.topic, shortAddress(conversation.peerAddress), "New Conversation")
    }

    private fun subscribeToTopic(apiURI: String, expoPushToken: String, topic: String) {
        val appendTopicURI = "$apiURI/api/subscribe/append"
        val params: MutableMap<String?, String?> = HashMap()
        params["topic"] = topic
        params["expoToken"] = expoPushToken

        val parameters = JSONObject(params as Map<*, *>?)

        val jsonRequest = JsonObjectRequest(Request.Method.POST, appendTopicURI, parameters, {
            //TODO: handle success
        }) { error ->
            error.printStackTrace()
            //TODO: handle failure
        }

        Volley.newRequestQueue(this).add(jsonRequest)
    }

    private fun handleNewMessageNotification(envelope: Envelope) {
        val conversation = getPersistedConversation(envelope.contentTopic)
        if (conversation === null) {
            Log.d(TAG, "No conversation found for ${envelope.contentTopic}")
            return
        }

        val decodedMessage = conversation.decode(envelope)

        saveMessageToStorage(envelope.contentTopic, decodedMessage)
        if (decodedMessage.senderAddress == xmtpClient.address) return
        var title = getSavedConversationTitle(envelope.contentTopic)
        if (title == "") {
            title = shortAddress(decodedMessage.senderAddress)
        }

        showNotification(envelope.contentTopic, title, decodedMessage.body)
    }

    private fun saveMessageToStorage(topic: String, decodedMessage: DecodedMessage) {
        val currentSavedMessagesString = getMMKV("saved-notifications-messages")
        var currentSavedMessages = Klaxon().parseArray<SavedNotificationMessage>(currentSavedMessagesString ?: "[]") ?: listOf()
        val newMessageToSave = SavedNotificationMessage(
            topic,
            decodedMessage.body,
            decodedMessage.senderAddress,
            decodedMessage.sent.time,
            decodedMessage.id
        )
        currentSavedMessages += newMessageToSave
        val newSavedMessagesString = Klaxon().toJsonString(currentSavedMessages)
        setMMKV("saved-notifications-messages", newSavedMessagesString)
    }

    private fun getKeychainValue(key: String) = runBlocking {
        val argumentsMap = mutableMapOf<String, Any>()
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


    private fun getMMKV(key: String): String? {
        val kv = MMKV.defaultMMKV()
        return kv.decodeString(key)
    }

    private fun setMMKV(key: String, value: String): Boolean {
        val kv = MMKV.defaultMMKV()
        return kv.encode(key, value)
    }

    private fun showNotification(topic: String, title: String, message: String) {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, (PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Build the notification
        val notificationBuilder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        // Show the notification
        val currentTimeMillis = System.currentTimeMillis()
        val notificationId = "$topic-$currentTimeMillis".hashCode()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }

    private fun getKeyByteArrayFromBase64(base64String: String): ByteArray {
        // Exported byte array from JS does not have the same format as Kotlin
        // 3 leading bytes to remove...
        val decodedKeys = Base64.decode(base64String, Base64.NO_WRAP)
        var newKeys = decodedKeys.slice(3 until decodedKeys.size)
        return newKeys.toByteArray()
    }


    private fun initXmtpClient() {
        val xmtpBase64KeyString = getKeychainValue("XMTP_BASE64_KEY")
        val keys = PrivateKeyBundleV1.parseFrom(getKeyByteArrayFromBase64(xmtpBase64KeyString))

        val xmtpEnvString = getMMKV("xmtp-env")
        val xmtpEnv =
            if (xmtpEnvString == "production") XMTPEnvironment.PRODUCTION else XMTPEnvironment.DEV

        val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true))

        xmtpClient = Client().buildFrom(bundle = keys, options = options)
    }

    private fun getPersistedConversation(topic: String): Conversation? {
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
        val savedConversationDict = getMMKV("conversation-$topic")
        if (savedConversationDict == null) return ""
        val parsedConversationDict = Klaxon().parse<ConversationDictData>(savedConversationDict)
        return ((parsedConversationDict?.lensHandle ?: parsedConversationDict?.ensName) ?: parsedConversationDict?.shortAddress) ?: ""
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
}