package com.converse.dev

import android.app.ActivityManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import androidx.core.app.NotificationCompat
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
import org.xmtp.android.library.Client
import org.xmtp.android.library.ClientOptions
import org.xmtp.android.library.Conversation
import org.xmtp.android.library.XMTPEnvironment
import org.xmtp.android.library.messages.EnvelopeBuilder
import org.xmtp.proto.message.contents.PrivateKeyOuterClass
import java.security.MessageDigest
import java.util.*

class NotificationData(val message: String, val timestampNs: String, val contentTopic: String)
class ConversationDictData(val shortAddress: String? = null, val lensHandle: String? = null, val ensName: String? = null)

fun truncatedAddress(input: String): String {
    if (input.length > 6) {
        val start = 6
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
            Log.d(TAG, "Could not init XMTP client")
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        if (applicationInForeground()) {
            Log.d(TAG, "[AndroidNotificationService] App is in foreground, dropping")
            return
        }
        Log.d(TAG, "[AndroidNotificationService] Received a notification")

        // Check if message contains a data payload.
        if (remoteMessage.data.isEmpty()) return
        Log.d(TAG, "Message data payload: ${remoteMessage.data["body"]}")

        val envelopeJSON = remoteMessage.data["body"]
        if (envelopeJSON === null || envelopeJSON.isEmpty()) return

        val notificationData = Klaxon().parse<NotificationData>(envelopeJSON)
        if (notificationData === null) return
        Log.d(TAG, "Decoded notification data: topic is ${notificationData.contentTopic}")

        val conversation = getPersistedConversation(notificationData.contentTopic)
        if (conversation === null) return

        val encryptedMessageData = Base64.decode(notificationData.message, Base64.NO_WRAP)
        val envelope = EnvelopeBuilder.buildFromString(notificationData.contentTopic, Date(notificationData.timestampNs.toLong()/1000000), encryptedMessageData)
        val decodedMessage = conversation.decode(envelope)

        showNotification(notificationData.contentTopic, getSavedConversationTitle(notificationData.contentTopic), decodedMessage.body)
    }
    private fun getAndroidByteArrayFromJSByteArray(jsByteArray: ByteArray): ByteArray {
        // Exported byte array from JS does not have the same format as Kotlin
        // 3 leading bytes to remove, then convert unsigned byte array to signed byte array
        val asList = jsByteArray.toList()
        val transformedList =
            asList.map { it -> if (it > 127) it - 256 else it }?.slice(3 until asList.size) as List<Byte>
        return transformedList.toByteArray()
    }


    private fun getKeychainValue(key: String) = runBlocking {
        val argumentsMap = mutableMapOf<String, Any>()
        argumentsMap["keychainService"] = "com.converse.dev"

        val arguments = MapArguments(argumentsMap)

        var promiseResult: Any? = null;

        val promise = PromiseImpl({ result: Array<Any?>? -> promiseResult = result?.get(0) }, { error: Array<Any?>? -> })
        val promiseWrapped = PromiseWrapper(promise)
        withContext(Dispatchers.Default) {
            secureStoreModule.getValueWithKeyAsync(key, arguments, promiseWrapped)
        }
        return@runBlocking promiseResult as String
    }


    private fun getMMKV(key: String): String? {
        val kv = MMKV.defaultMMKV()
        return kv.decodeString(key)
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

    private fun initXmtpClient() {
        val xmtpKeyString = getKeychainValue("XMTP_KEYS")
        val xmtpKey = Klaxon().parseArray<Int>(xmtpKeyString) as List<Byte>

        val xmtpKeyByteArray = getAndroidByteArrayFromJSByteArray(xmtpKey.toByteArray())

        val xmtpEnvString = getMMKV("xmtp-env")
        val xmtpEnv =
            if (xmtpEnvString == "production") XMTPEnvironment.PRODUCTION else XMTPEnvironment.DEV

        val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true))
        val keys =
            PrivateKeyOuterClass.PrivateKeyBundleV1.parseFrom(xmtpKeyByteArray)
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

    private fun getSavedConversationTitle(topic: String): String {
        val savedConversationDict = getMMKV("conversation-$topic")
        Log.d(TAG, "GOT THE SAVED CONVERSATION: $savedConversationDict")
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