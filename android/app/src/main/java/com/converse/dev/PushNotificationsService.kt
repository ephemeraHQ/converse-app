package com.converse.dev

import android.app.ActivityManager
import android.util.Log
import android.view.View
import com.beust.klaxon.Klaxon
import com.converse.dev.xmtp.getXmtpClient
import com.converse.dev.xmtp.handleNewConversationV2Notification
import com.converse.dev.xmtp.handleNewMessageNotification
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
import org.xmtp.android.library.*
import org.xmtp.android.library.messages.EnvelopeBuilder
import java.util.*
import org.xmtp.android.library.codecs.*

class PushNotificationsService : FirebaseMessagingService() {
    companion object {
        private const val TAG = "PushNotificationsService"
        lateinit var secureStoreModule: SecureStoreModule
        lateinit var asyncStorageModule: AsyncStorageModule
    }

    override fun onCreate() {
        super.onCreate()
        initSecureStore()
        initAsyncStorage()
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

        initCodecs()
        val xmtpClient = getXmtpClient(this, notificationData.contentTopic)
        if (xmtpClient == null) {
            Log.d(TAG, "NO XMTP CLIENT FOUND FOR TOPIC ${notificationData.contentTopic}")
            return
        }
        // Let's add "account" to RemoteMessage to make it accessible to RN
        val newNotificationData = NotificationData(
            notificationData.message,
            notificationData.timestampNs,
            notificationData.contentTopic,
            notificationData.sentViaConverse,
            xmtpClient.address,
            null
        )
        val newNotificationDataJson = Klaxon().toJsonString(newNotificationData)
        remoteMessage.data["body"] = newNotificationDataJson

        val encryptedMessageData = Base64.decode(notificationData.message, Base64.NO_WRAP)
        val envelope = EnvelopeBuilder.buildFromString(notificationData.contentTopic, Date(notificationData.timestampNs.toLong()/1000000), encryptedMessageData)
        val sentViaConverse = notificationData.sentViaConverse!!

        if (isIntroTopic(notificationData.contentTopic)) {
            return
        } else if (isInviteTopic(notificationData.contentTopic)) {
            Log.d(TAG, "Handling a new conversation notification")
            val notificationToShow = handleNewConversationV2Notification(this, xmtpClient, envelope, remoteMessage, notificationData)
            if (notificationToShow != null) {
                showNotification(notificationToShow.first, notificationToShow.second, notificationToShow.third)
            }
        } else {
            Log.d(TAG, "Handling a new message notification")
            val notificationToShow = handleNewMessageNotification(xmtpClient, envelope, remoteMessage, sentViaConverse)
            if (notificationToShow != null) {
                showNotification(notificationToShow.first, notificationToShow.second, notificationToShow.third)
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
        Log.d(TAG, "SHOW ${request.identifier} ${request.trigger}")
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