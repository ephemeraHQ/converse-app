import { Platform } from "react-native";

import { useSettingsStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { getCurrentAccountPrimaryProfile } from "@utils/profile/getCurrentAccountPrimaryProfile";

export function isMissingConverseProfile() {
  return !getCurrentAccountPrimaryProfile();
}

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
