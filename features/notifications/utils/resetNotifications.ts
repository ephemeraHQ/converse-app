import mmkv from "@utils/mmkv";
import * as Notifications from "expo-notifications";

export const resetNotifications = async (
  timeout: number = 0
): Promise<void> => {
  setTimeout(async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
    mmkv.set("notifications-badge", 0);
  }, timeout);
};
