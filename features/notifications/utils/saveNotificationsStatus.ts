import { useAppStore } from "@data/store/appStore";
import { getNotificationsPermissionStatus } from "./getNotificationsPermissionStatus";

export const saveNotificationsStatus = async () => {
  const notificationsStatus = await getNotificationsPermissionStatus();
  if (
    notificationsStatus === "undetermined" ||
    notificationsStatus === "granted" ||
    notificationsStatus === "denied"
  ) {
    useAppStore
      .getState()
      .setNotificationsPermissionStatus(notificationsStatus);
  }
};
