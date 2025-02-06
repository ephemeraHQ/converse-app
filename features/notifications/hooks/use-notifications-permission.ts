import { Platform, Linking } from "react-native";
import { useAppStore } from "@/data/store/appStore";
import { requestPushNotificationsPermissions } from "../utils/requestPushNotificationsPermissions";
import { useSettingsStore } from "@/features/multi-inbox/multi-inbox.store";

type UseNotificationsPermissionReturn = {
  notificationsPermissionStatus: "granted" | "undetermined" | "denied";
  requestPermission: () => Promise<void>;
  setNotificationsSettings: (settings: {
    showNotificationScreen: boolean;
  }) => void;
};

export function useNotificationsPermission(): UseNotificationsPermissionReturn {
  const notificationsPermissionStatus = useAppStore(
    (s) => s.notificationsPermissionStatus
  );
  const setNotificationsPermissionStatus = useAppStore(
    (s) => s.setNotificationsPermissionStatus
  );
  const setNotificationsSettings = useSettingsStore(
    (s) => s.setNotificationsSettings
  );

  const requestPermission = async () => {
    if (notificationsPermissionStatus === "denied") {
      if (Platform.OS === "android") {
        // Android 13 is always denied first so let's try to show
        const newStatus = await requestPushNotificationsPermissions();
        if (newStatus === "denied") {
          Linking.openSettings();
        } else if (newStatus) {
          setNotificationsPermissionStatus(newStatus);
        }
      } else {
        Linking.openSettings();
      }
    } else if (notificationsPermissionStatus === "undetermined") {
      // Open popup
      const newStatus = await requestPushNotificationsPermissions();
      if (!newStatus) return;
      setNotificationsPermissionStatus(newStatus);
    }
  };

  return {
    notificationsPermissionStatus,
    requestPermission,
    setNotificationsSettings,
  };
}
