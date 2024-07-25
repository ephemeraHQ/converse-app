package com.converse.dev

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.converse.dev.xmtp.NotificationDataResult
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.service.NotificationsService.Companion.EVENT_TYPE_KEY
import expo.modules.notifications.service.NotificationsService.Companion.NOTIFICATION_EVENT_ACTION
import expo.modules.notifications.service.NotificationsService.Companion.findDesignatedBroadcastReceiver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// For chat specific notifications with PFP, following instructions at
// https://proandroiddev.com/display-android-notifications-with-a-contact-image-on-the-left-like-all-messaging-apps-bbd108f5d147

suspend fun customizeMessageNotification(context: Context, builder: NotificationCompat.Builder, expoNotification: Notification, result: NotificationDataResult) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        // Code that requires API level P (28) or higher
        val senderName = if (result.isGroup) result.subtitle else result.title
        val senderBuilder = Person.Builder().setName(senderName)
        val senderBitmap = result.avatar?.let {
            getBitmapFromURL(context, it)
        }
        val senderIcon = senderBitmap?.let { IconCompat.createWithBitmap(it) }
        senderBuilder.setIcon(senderIcon)
        val sender = senderBuilder.build()
        val chatMessageStyle = createMessageNotificationStyle(
            sender = sender,
            text = result.body,
            groupName = if (result.isGroup) result.title else null
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

            createDynamicShortcut(context, intent, "person-shortcut", result.title, sender, senderBitmap)
            builder.setShortcutId("person-shortcut")
        }
    }
}

suspend fun getBitmapFromURL(context: Context, avatarUrl: String): Bitmap? {
    try {
        return withContext(Dispatchers.IO) {
            val bitmap = Glide.with(context)
                .asBitmap()
                .load(avatarUrl)
                .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
                .submit()
                .get()

            return@withContext bitmap
        }
    } catch (e: Exception) {
        return null
    }
}

@RequiresApi(Build.VERSION_CODES.P)
suspend fun createMessageNotificationStyle(
    sender: Person,
    text: String,
    groupName: String? = null,
): NotificationCompat.MessagingStyle {
    val user = Person.Builder()
        .setName("You")
        .setKey("you")
        .build()
    val chatMessageStyle = NotificationCompat.MessagingStyle(user)
    val notificationMessage = NotificationCompat.MessagingStyle.Message(
        text,
        System.currentTimeMillis(),
        sender,
    )
    chatMessageStyle.addMessage(notificationMessage)
    if (groupName !== null) {
        chatMessageStyle.setGroupConversation(true)
        chatMessageStyle.setConversationTitle(groupName)
    }
    return chatMessageStyle
}

fun createDynamicShortcut(
    context: Context,
    intent: Intent,
    shortcutId: String,
    shortLabel: String,
    person: Person,
    notificationIcon: Bitmap?,
) {
    val shortcutBuilder = ShortcutInfoCompat.Builder(
        context,
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
    ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
}