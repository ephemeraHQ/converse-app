import { FirebaseMessagingTypes } from "@react-native-firebase/messaging/lib";
import * as Notifications from "expo-notifications";

export const handleAndroidBackgroundNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  const bodyString = remoteMessage.data?.body;
  let data: { [key: string]: any } = {};
  if (bodyString) {
    try {
      data = JSON.parse(bodyString);
    } catch (e: any) {
      console.log(e);
    }
  }
  console.log(
    "[Android Background Notification] received a notification with data"
  );
  console.log(data);
  Notifications.scheduleNotificationAsync({
    content: {
      title: data.haha || "NoHaHa",
      body: `Displayed ? ${remoteMessage.notification ? "yes" : "no"}`,
    },
    trigger: null,
  });
};
