import api from "@utils/api";
import * as Notifications from "expo-notifications";

export const unsubscribeFromNotifications = async (apiHeaders: {
  [key: string]: string;
}): Promise<void> => {
  // Add a 5 sec timeout so not to block us ?
  const nativeTokenQuery = (await Promise.race([
    Notifications.getDevicePushTokenAsync(),
    new Promise((res) => setTimeout(() => res(undefined), 5000)),
  ])) as any;
  if (nativeTokenQuery?.data) {
    await api.post(
      "/api/unsubscribe",
      {
        nativeToken: nativeTokenQuery.data,
      },
      { headers: apiHeaders }
    );
  }
};
