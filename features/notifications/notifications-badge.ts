import * as Notifications from "expo-notifications";

export function resetNotificationsBadgeCount() {
  return Notifications.setBadgeCountAsync(0);
}

export async function incrementNotificationsBadgeCount() {
  const badgeCount = await Notifications.getBadgeCountAsync();
  return Notifications.setBadgeCountAsync(badgeCount + 1);
}

export async function decrementNotificationsBadgeCount() {
  const badgeCount = await Notifications.getBadgeCountAsync();
  return Notifications.setBadgeCountAsync(badgeCount - 1);
}
