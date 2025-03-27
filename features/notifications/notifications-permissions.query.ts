import { queryOptions } from "@tanstack/react-query"
import * as Notifications from "expo-notifications"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

export const getNotificationsPermissionsQueryConfig = () => {
  return queryOptions({
    queryKey: ["notifications-permissions"],
    queryFn: () => {
      return Notifications.getPermissionsAsync()
    },
    staleTime: Infinity,
  })
}

export function ensureNotificationsPermissions() {
  return reactQueryClient.ensureQueryData(getNotificationsPermissionsQueryConfig())
}
