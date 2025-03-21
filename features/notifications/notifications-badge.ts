import * as Notifications from "expo-notifications"
import { notificationsLogger } from "@/utils/logger"

export function resetNotificationsBadgeCount() {
  notificationsLogger.debug("Resetting notifications badge count")
  return Notifications.setBadgeCountAsync(0)
}

export async function incrementNotificationsBadgeCount() {
  const badgeCount = await Notifications.getBadgeCountAsync()
  notificationsLogger.debug(
    `Incrementing notifications badge count from ${badgeCount} to ${badgeCount + 1}`,
  )
  return Notifications.setBadgeCountAsync(badgeCount + 1)
}

export async function decrementNotificationsBadgeCount() {
  const badgeCount = await Notifications.getBadgeCountAsync()
  notificationsLogger.debug(
    `Decrementing notifications badge count from ${badgeCount} to ${badgeCount - 1}`,
  )
  return Notifications.setBadgeCountAsync(badgeCount - 1)
}
