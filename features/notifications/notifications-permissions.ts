import { queryClient } from "@/queries/queryClient";
import { queryOptions } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

const getNotificationsPermissionsQueryConfig = () => {
  return queryOptions({
    queryKey: ["notifications-permissions"],
    queryFn: () => {
      return Notifications.getPermissionsAsync();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: Infinity,
  });
};

export function getOrFetchNotificationsPermissions() {
  return queryClient.ensureQueryData(getNotificationsPermissionsQueryConfig());
}

export async function userHasGrantedNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions();
  return permission.status === Notifications.PermissionStatus.GRANTED;
}

export async function canAskForNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions();
  return permission.canAskAgain;
}

export async function requestNotificationsPermissions() {
  if (!(await canAskForNotificationsPermissions())) {
    Linking.openSettings();
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
    });
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  });
}
