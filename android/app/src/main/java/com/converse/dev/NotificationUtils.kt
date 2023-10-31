package com.converse.dev

import android.util.Log
import android.content.Context
import me.leolin.shortcutbadger.ShortcutBadger

private const val TAG = "NotificationUtils"
private const val MAX_STORED_IDS = 10

fun incrementBadge(context: Context) {
    val newBadgeCount = getBadge(context) + 1
    setBadge(context, newBadgeCount)
    ShortcutBadger.applyCount(context, newBadgeCount)
}
fun notificationAlreadyShown(appContext: Context, messageId: String?): Boolean {
    Log.d(TAG, "Checking if we should show notification for message ID: $messageId")

    messageId?.let {
        val existingIds = getShownNotificationIds(appContext)

        if (existingIds.contains(it)) {
            Log.d(TAG, "Message ID already exists. Not showing notification.")
            return true
        }

        val updatedIds = existingIds + it
        val trimmedList = if (updatedIds.size > MAX_STORED_IDS) {
            updatedIds.subList(updatedIds.size - MAX_STORED_IDS, updatedIds.size)
        } else {
            updatedIds
        }

        setShownNotificationIds(appContext, trimmedList)

        val storedData = getShownNotificationIds(appContext).joinToString(", ")
        Log.d(TAG, "Stored IDs just after saving: $storedData")

        return false
    }
    Log.d(TAG, "Message ID is null. Not showing notification.")
    return true
}