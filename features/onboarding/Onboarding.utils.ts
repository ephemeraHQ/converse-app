import { Platform } from "react-native";
import { useAppStore } from "../../stores/app-store";
import { useSettingsStore } from "../multi-inbox/multi-inbox.store";

export function needToShowNotificationsPermissions() {
  const notifications = useSettingsStore.getState().notifications;
  const notificationsPermissionStatus =
    useAppStore.getState().notificationsPermissionStatus;

  return (
    notifications.showNotificationScreen &&
    (notificationsPermissionStatus === "undetermined" ||
      (notificationsPermissionStatus === "denied" && Platform.OS === "android"))
  );
}
