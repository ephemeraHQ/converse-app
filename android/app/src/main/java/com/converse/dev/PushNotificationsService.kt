package com.converse.dev

import android.app.ActivityManager
import android.util.Log
import android.view.View
import com.beust.klaxon.Klaxon
import com.converse.dev.xmtp.NotificationDataResult
import com.converse.dev.xmtp.getNewConversationFromEnvelope
import com.converse.dev.xmtp.getXmtpClient
import com.converse.dev.xmtp.handleNewConversationFirstMessage
import com.converse.dev.xmtp.handleOngoingConversationMessage
import com.converse.dev.xmtp.initCodecs
import com.facebook.react.bridge.ReactApplicationContext
import com.google.crypto.tink.subtle.Base64
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.reactnativecommunity.asyncstorage.AsyncStorageModule
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ViewManager
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.SingletonModule
import expo.modules.notifications.notifications.JSONNotificationContentBuilder
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.securestore.SecureStoreModule
import org.json.JSONObject
import org.xmtp.android.library.messages.EnvelopeBuilder
import java.util.*
import kotlinx.coroutines.*

class PushNotificationsService : FirebaseMessagingService() {
    companion object {
        const val TAG = "PushNotificationsService"
        lateinit var secureStoreModule: SecureStoreModule
        lateinit var asyncStorageModule: AsyncStorageModule
    }

    override fun onCreate() {
        super.onCreate()
        initSecureStore()
        initAsyncStorage()
        initSentry(this)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "Received a notification")

        // Check if message contains a data payload.
        if (remoteMessage.data.isEmpty()) return

        val envelopeJSON = remoteMessage.data["body"] ?: return
        Log.d(TAG, "Message data payload: $envelopeJSON")

        val notificationData = Klaxon().parse<NotificationData>(envelopeJSON) ?: return
        Log.d(TAG, "Decoded notification data: account is ${notificationData.account} - topic is ${notificationData.contentTopic}")

        initCodecs() // Equivalent to initSentry()
        val accounts = getAccounts(this)

        if (!accounts.contains(notificationData.account)) {
            Log.d(TAG, "Account ${notificationData.account} is not in store")
            return
        }

        val xmtpClient = getXmtpClient(this, notificationData.account) ?: run {
            Log.d(TAG, "NO XMTP CLIENT FOUND FOR TOPIC ${notificationData.contentTopic}")
            return
        }

        val encryptedMessageData = Base64.decode(notificationData.message, Base64.NO_WRAP)
        val envelope = EnvelopeBuilder.buildFromString(notificationData.contentTopic, Date(notificationData.timestampNs.toLong() / 1000000), encryptedMessageData)

        var shouldShowNotification = false
        var result = NotificationDataResult()

        // Using IO dispatcher for background work, not blocking the main thread and UI
        val appContext = this
        GlobalScope.launch(Dispatchers.IO) {
            try {
                if (isInviteTopic(notificationData.contentTopic)) {
                    Log.d(TAG, "Handling a new conversation notification")
                    val conversation = getNewConversationFromEnvelope(xmtpClient, envelope)
                    if (conversation != null) {
                        result = handleNewConversationFirstMessage(
                            appContext,
                            xmtpClient,
                            conversation,
                            remoteMessage
                        )
                        if (result != NotificationDataResult()) {
                            shouldShowNotification = result.shouldShowNotification
                        }

                        // Replace invite-topic with the topic in the notification content
                        val newNotificationData = NotificationData(
                            notificationData.message,
                            notificationData.timestampNs,
                            conversation.topic,
                            notificationData.sentViaConverse,
                            notificationData.account,
                        )
                        val newNotificationDataJson = Klaxon().toJsonString(newNotificationData)
                        remoteMessage.data["body"] = newNotificationDataJson
                    }
                } else {
                    Log.d(TAG, "Handling an ongoing conversation message notification")
                    result = handleOngoingConversationMessage(appContext, xmtpClient, envelope, remoteMessage)
                    if (result != NotificationDataResult()) {
                        shouldShowNotification = result.shouldShowNotification
                    }
                }
                val notificationAlreadyShown = notificationAlreadyShown(appContext, result.messageId)

                if (shouldShowNotification && !notificationAlreadyShown) {
                    incrementBadge(appContext)
                    result.remoteMessage?.let { showNotification(result.title, result.body, it) }
                }
            } catch (e: Exception) {
                // Handle any exceptions
                Log.e(TAG, "Error on IO Dispatcher coroutine", e)
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
        Log.d(TAG, "SHOWING NOTIFICATION WITH DATA $data")
        val payload = JSONObject(data as Map<*, *>)
        val content = JSONNotificationContentBuilder(this).setPayload(payload).build()
        val request = createNotificationRequest(identifier, content, FirebaseNotificationTrigger(remoteMessage))
        return Notification(request, Date(remoteMessage.sentTime))
    }

    private fun showNotification(title: String, message: String, remoteMessage: RemoteMessage) {
        NotificationsService.receive(this, createNotificationFromRemoteMessage(title, message, remoteMessage))
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