import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQueries, useQuery } from "@tanstack/react-query"
import { fetchProfile } from "@/features/profiles/profiles.api"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IProfileQueryData = Awaited<ReturnType<typeof fetchProfile>>

export const getProfileQueryConfig = ({ xmtpId }: { xmtpId: IXmtpInboxId | undefined }) => {
  const enabled = !!xmtpId
  return queryOptions({
    enabled,
    queryKey: ["profile", xmtpId],
    queryFn: enabled ? () => fetchProfile({ xmtpId }) : skipToken,
  })
}

export const useProfileQuery = ({ xmtpId }: { xmtpId: IXmtpInboxId | undefined }) => {
  return useQuery(getProfileQueryConfig({ xmtpId }))
}

export const setProfileQueryData = (args: { xmtpId: IXmtpInboxId; data: IProfileQueryData }) => {
  const { xmtpId, data } = args
  return reactQueryClient.setQueryData(getProfileQueryConfig({ xmtpId }).queryKey, data)
}

export function updateProfileQueryData(args: {
  xmtpId: IXmtpInboxId
  data: Partial<IProfileQueryData>
}) {
  const { xmtpId, data } = args
  return reactQueryClient.setQueryData(getProfileQueryConfig({ xmtpId }).queryKey, (oldData) => {
    if (!oldData) {
      return oldData
    }
    return {
      ...oldData,
      ...data,
    }
  })
}
export const ensureProfileQueryData = ({ xmtpId }: { xmtpId: IXmtpInboxId }) => {
  return reactQueryClient.ensureQueryData(getProfileQueryConfig({ xmtpId }))
}

export const invalidateProfileQuery = ({ xmtpId }: { xmtpId: IXmtpInboxId }) => {
  reactQueryClient.invalidateQueries({
    queryKey: getProfileQueryConfig({ xmtpId }).queryKey,
  })
}

export const useProfilesQueries = ({
  xmtpInboxIds,
}: {
  xmtpInboxIds: IXmtpInboxId[] | undefined
}) => {
  return useQueries({
    queries: (xmtpInboxIds ?? []).map((xmtpInboxId) =>
      getProfileQueryConfig({ xmtpId: xmtpInboxId }),
    ),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      error: results.find((result) => result.error)?.error,
    }),
  })
}

export const getProfileQueryData = ({ xmtpId }: { xmtpId: IXmtpInboxId }) => {
  return reactQueryClient.getQueryData(getProfileQueryConfig({ xmtpId }).queryKey)
}
