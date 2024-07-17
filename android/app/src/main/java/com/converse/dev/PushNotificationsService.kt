package com.converse.dev

import android.Manifest
import android.app.ActivityManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Parcelable
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.beust.klaxon.Klaxon
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.converse.dev.xmtp.NotificationDataResult
import com.converse.dev.xmtp.getNewConversationFromEnvelope
import com.converse.dev.xmtp.getNewGroup
import com.converse.dev.xmtp.getXmtpClient
import com.converse.dev.xmtp.handleGroupMessage
import com.converse.dev.xmtp.handleGroupWelcome
import com.converse.dev.xmtp.handleNewConversationFirstMessage
import com.converse.dev.xmtp.handleOngoingConversationMessage
import com.converse.dev.xmtp.initCodecs
import com.facebook.react.bridge.ReactApplicationContext
import com.google.crypto.tink.subtle.Base64
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.reactnativecommunity.asyncstorage.AsyncStorageModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.SingletonModule
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.notifications.notifications.JSONNotificationContentBuilder
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.notifications.presentation.builders.CategoryAwareNotificationBuilder
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder
import expo.modules.notifications.service.NotificationsService.Companion.EVENT_TYPE_KEY
import expo.modules.notifications.service.NotificationsService.Companion.NOTIFICATION_ACTION_KEY
import expo.modules.notifications.service.NotificationsService.Companion.NOTIFICATION_EVENT_ACTION
import expo.modules.notifications.service.NotificationsService.Companion.NOTIFICATION_KEY
import expo.modules.notifications.service.NotificationsService.Companion.findDesignatedBroadcastReceiver
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import expo.modules.securestore.AuthenticationHelper
import expo.modules.securestore.SecureStoreModule
import expo.modules.securestore.encryptors.AESEncryptor
import expo.modules.securestore.encryptors.HybridAESEncryptor
import kotlinx.coroutines.*
import org.json.JSONObject
import org.xmtp.android.library.messages.EnvelopeBuilder
import java.lang.ref.WeakReference
import java.security.KeyStore
import java.util.*
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible
import kotlin.reflect.jvm.javaField

class PushNotificationsService : FirebaseMessagingService() {
    companion object {
        const val TAG = "PushNotificationsService"
        lateinit var secureStoreModule: SecureStoreModule
        lateinit var asyncStorageModule: AsyncStorageModule
        lateinit var reactAppContext: ReactApplicationContext
    }

    override fun onCreate() {
        super.onCreate()
        initSecureStore()
        initAsyncStorage()
        initSentry(this)
    }

    // Define a CoroutineScope for the service
    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

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

        Log.d(TAG, "INSTANTIATED XMTP CLIENT FOR ${notificationData.contentTopic}")

        val encryptedMessageData = Base64.decode(notificationData.message, Base64.NO_WRAP)
        val envelope = EnvelopeBuilder.buildFromString(notificationData.contentTopic, Date(notificationData.timestampNs.toLong() / 1000000), encryptedMessageData)

        var shouldShowNotification = false
        var result = NotificationDataResult()

        // Using IO dispatcher for background work, not blocking the main thread and UI
        serviceScope.launch {
            try {
                if (isInviteTopic(notificationData.contentTopic)) {
                    Log.d(TAG, "Handling a new conversation notification")
                    val conversation = getNewConversationFromEnvelope(applicationContext, xmtpClient, envelope)
                    if (conversation != null) {
                        result = handleNewConversationFirstMessage(
                            applicationContext,
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
                            notificationData.account,
                        )
                        val newNotificationDataJson = Klaxon().toJsonString(newNotificationData)
                        remoteMessage.data["body"] = newNotificationDataJson
                    }
                } else if (isGroupWelcomeTopic(notificationData.contentTopic)) {
                    val group = getNewGroup(xmtpClient, notificationData.contentTopic)
                    if (group != null) {
                        result = handleGroupWelcome(applicationContext, xmtpClient, group, remoteMessage)
                        if (result != NotificationDataResult()) {
                            shouldShowNotification = result.shouldShowNotification
                        }
                    }
                }  else if (isGroupMessageTopic(notificationData.contentTopic)) {
                    Log.d(TAG, "Handling an ongoing group message notification")
                    result = handleGroupMessage(applicationContext, xmtpClient, envelope, remoteMessage)
                    if (result != NotificationDataResult()) {
                        shouldShowNotification = result.shouldShowNotification
                    }
                } else {
                    Log.d(TAG, "Handling an ongoing conversation message notification")
                    result = handleOngoingConversationMessage(applicationContext, xmtpClient, envelope, remoteMessage)
                    if (result != NotificationDataResult()) {
                        shouldShowNotification = result.shouldShowNotification
                    }
                }
                val notificationAlreadyShown = notificationAlreadyShown(applicationContext, result.messageId)

                if (shouldShowNotification && !notificationAlreadyShown) {
                    incrementBadge(applicationContext)
                    result.remoteMessage?.let { showNotification(result.title, result.subtitle, result.body, it) }
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

    private fun createNotificationFromRemoteMessage(title: String, subtitle:String?, message: String, remoteMessage: RemoteMessage): Notification {
        val identifier = getNotificationIdentifier(remoteMessage)
        var data = remoteMessage.data as MutableMap<Any, Any>
        data["title"] = title
        if (subtitle !== null) {
            data["subtitle"] = subtitle
        }
        data["message"] = message
        Log.d(TAG, "SHOWING NOTIFICATION WITH DATA $data")
        val payload = JSONObject(data as Map<*, *>)
        val content = JSONNotificationContentBuilder(this).setPayload(payload).build()
        val request = createNotificationRequest(identifier, content, FirebaseNotificationTrigger(remoteMessage))
        return Notification(request, Date(remoteMessage.sentTime))
    }

    suspend fun getBitmapFromURL(avatarUrl: String): Bitmap {
        var context = this;
        return withContext(Dispatchers.IO) {
            val bitmap = Glide.with(context)
                .asBitmap()
                .load(avatarUrl)
                .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
                .submit()
                .get()

            return@withContext bitmap
        }
    }

//    fun getRoundedBitmap(bitmap: Bitmap, cornerRadius: Float): Bitmap {
//        val output = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
//        val canvas = Canvas(output)
//
//        val paint = Paint().apply {
//            isAntiAlias = true
//            shader = BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
//        }
//
//        val rect = RectF(0f, 0f, bitmap.width.toFloat(), bitmap.height.toFloat())
//        canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint)
//
//        return output
//    }

    @RequiresApi(Build.VERSION_CODES.P)
    suspend fun createMessageNotificationStyle(
        person: Person,
        text: String,
    ): NotificationCompat.MessagingStyle {
        val chatMessageStyle = NotificationCompat.MessagingStyle(person)
        val notificationMessage = NotificationCompat.MessagingStyle.Message(
            text,
            System.currentTimeMillis(),
            person,
        )
        chatMessageStyle.addMessage(notificationMessage)
        return chatMessageStyle
    }

    fun createDynamicShortcut(
        intent: Intent,
        shortcutId: String,
        shortLabel: String,
        person: Person,
        notificationIcon: Bitmap?,
    ) {
        val shortcutBuilder = ShortcutInfoCompat.Builder(
            this,
            shortcutId,
        )
            .setLongLived(true)
            .setIntent(intent)
            .setShortLabel(shortLabel)
            .setPerson(person)

        if (notificationIcon != null) {
            val icon = IconCompat.createWithAdaptiveBitmap(notificationIcon)
            shortcutBuilder.setIcon(icon)
        }

        val shortcut = shortcutBuilder.build()
        ShortcutManagerCompat.pushDynamicShortcut(this, shortcut)
    }

    private suspend fun showNotification(title: String, subtitle: String?, message: String, remoteMessage: RemoteMessage) {
        val context = this

        // Hooking into Expo's androit notification system to get the native NotificationCompat builder and customize it
        // while still enablig Expo's React Native notification interaction handling

        val expoNotification = createNotificationFromRemoteMessage(title, subtitle, message, remoteMessage);
        val expoBuilder = CategoryAwareNotificationBuilder(this, SharedPreferencesNotificationCategoriesStore(this)).also {
            it.setNotification(expoNotification)
        } as ExpoNotificationBuilder
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val createBuilder = ExpoNotificationBuilder::class.java.getDeclaredMethod("createBuilder")
        createBuilder.isAccessible = true
        val builder = createBuilder.invoke(expoBuilder) as NotificationCompat.Builder

        // For chat specific notifications with PFP, following instructions at
        // https://proandroiddev.com/display-android-notifications-with-a-contact-image-on-the-left-like-all-messaging-apps-bbd108f5d147

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Code that requires API level P (28) or higher
            val bitmap = getBitmapFromURL("https://avatars.githubusercontent.com/u/2102342?v=4")
            val person = Person.Builder()
                .setName("Olivia")
                .setIcon(IconCompat.createWithBitmap(bitmap))
                .build()
            val chatMessageStyle = createMessageNotificationStyle(
                person = person,
                text = "Hello! How are you?",
            )
            builder.setStyle(chatMessageStyle);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Code for API level 30 or higher
                val defaultAction =
                    NotificationAction(NotificationResponse.DEFAULT_ACTION_IDENTIFIER, null, true)
                val intent = Intent(
                    NOTIFICATION_EVENT_ACTION,
                    Uri.parse("expo-notifications://notifications/").buildUpon()
                        .appendPath(expoNotification.notificationRequest.identifier)
                        .appendPath("actions")
                        .appendPath(defaultAction.identifier)
                        .build()
                ).also { intent ->
                    findDesignatedBroadcastReceiver(context, intent)?.let {
                        intent.component = ComponentName(it.packageName, it.name)
                    }
                    intent.putExtra(EVENT_TYPE_KEY, "receiveResponse")
//                    intent.putExtra(NOTIFICATION_KEY, expoNotification)
//                    intent.putExtra(NOTIFICATION_ACTION_KEY, defaultAction as Parcelable)
                }
                createDynamicShortcut(intent, "person-shortcut", "Olivia", person, bitmap)
                builder.setShortcutId("person-shortcut")
            }
        }


        NotificationManagerCompat.from(this).notify(
            expoNotification.notificationRequest.identifier,
            0,
            builder.build()
        )
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
        // Basically hooking inside React / Expo modules internals
        // to access the Expo SecureStore module from Kotlin

        val internalModules: Collection<InternalModule> = listOf()
        val singletonModules: Collection<SingletonModule> = listOf()

        val moduleRegistry = ModuleRegistry(internalModules, singletonModules)

        reactAppContext = ReactApplicationContext(this)
        val weakRef = WeakReference(reactAppContext)
        val appContext = AppContext(object : ModulesProvider {
            override fun getModulesList() =
                listOf(
                    SecureStoreModule::class.java,
                )
        }, moduleRegistry,  weakRef)
        secureStoreModule = SecureStoreModule()


        val appC = Module::class.declaredMemberProperties.find { it.name == "_appContext" }
        appC?.isAccessible = true
        appC?.javaField?.set(secureStoreModule, appContext)
        val authenticationHelper = SecureStoreModule::class.declaredMemberProperties.find { it.name == "authenticationHelper" }
        val hybridAESEncryptor = SecureStoreModule::class.declaredMemberProperties.find { it.name == "hybridAESEncryptor" }
        val keyStore = SecureStoreModule::class.declaredMemberProperties.find { it.name == "keyStore" }

        authenticationHelper?.isAccessible = true;
        hybridAESEncryptor?.isAccessible = true;
        keyStore?.isAccessible = true;

        authenticationHelper?.javaField?.set(secureStoreModule, AuthenticationHelper(reactAppContext, appContext.legacyModuleRegistry))
        hybridAESEncryptor?.javaField?.set(secureStoreModule, HybridAESEncryptor(reactAppContext, AESEncryptor()))
        val ks = KeyStore.getInstance("AndroidKeyStore")
        ks.load(null)
        keyStore?.javaField?.set(secureStoreModule, ks)
    }

    private fun initAsyncStorage() {
        val reactContext = ReactApplicationContext(this)
        asyncStorageModule = AsyncStorageModule(reactContext)
    }

    override fun onDestroy() {
        super.onDestroy()
        // Cancel the serviceScope when the service is destroyed
        serviceScope.cancel()
    }
}