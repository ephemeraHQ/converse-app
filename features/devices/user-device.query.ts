import { queryOptions } from "@tanstack/react-query"
import { getStoredDeviceId } from "@/features/devices/device.storage"
import { IDevice, IDeviceId } from "@/features/devices/devices.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"
import { IConvosCurrentUserId } from "../current-user/current-user.types"
import { fetchDevice } from "./devices.api"

type IDeviceQueryArgs = {
  userId: IConvosCurrentUserId
  deviceId: IDeviceId
}

export function getUserDeviceQueryOptions({ userId, deviceId }: IDeviceQueryArgs) {
  const enabled = !!userId && !!deviceId

  return queryOptions({
    queryKey: getReactQueryKey({
      baseStr: "device",
      userId,
      deviceId,
    }),
    queryFn: () => fetchDevice({ userId, deviceId }),
    enabled,
  })
}

export async function ensureUserDeviceQueryData({ userId }: { userId: IConvosCurrentUserId }) {
  const deviceId = await getStoredDeviceId()

  if (!deviceId) {
    throw new Error("No deviceId found in storage")
  }

  return reactQueryClient.ensureQueryData(getUserDeviceQueryOptions({ userId, deviceId }))
}

export function setUserDeviceQueryData(args: { userId: IConvosCurrentUserId; device: IDevice }) {
  const { userId, device } = args
  return reactQueryClient.setQueryData(
    getUserDeviceQueryOptions({ userId, deviceId: device.id }).queryKey,
    device,
  )
}
