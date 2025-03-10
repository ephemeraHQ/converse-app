import { queryOptions, skipToken, useQueries, useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { type IConvosProfileForInbox } from "@/features/profiles/profile.types"
import { fetchProfile } from "@/features/profiles/profiles.api"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

const profileQueryKey = ({ xmtpId }: { xmtpId: string }) => ["profile", xmtpId] as const

export const getProfileQueryConfig = ({ xmtpId }: { xmtpId: string | undefined }) => {
  const enabled = !!xmtpId
  return queryOptions({
    enabled,
    queryKey: profileQueryKey({ xmtpId: xmtpId! }),
    queryFn: enabled ? () => fetchProfile({ xmtpId: xmtpId! }) : skipToken,
  })
}

export const useProfileQuery = ({ xmtpId }: { xmtpId: string | undefined }) => {
  return useQuery(getProfileQueryConfig({ xmtpId }))
}

export const setProfileQueryData = (args: {
  xmtpId: string
  data: Partial<Omit<IConvosProfileForInbox, "updatedAt" | "createdAt">>
  updatedAt?: number
}) => {
  const { xmtpId, data } = args
  return reactQueryClient.setQueryData<Partial<IConvosProfileForInbox>>(
    profileQueryKey({ xmtpId }),
    {
      ...data,
      // updatedAt: updatedAt ? updatedAt.toString() : Date.now().toString(),
    },
  )
}

export const ensureProfileQueryData = ({ xmtpId }: { xmtpId: string }) => {
  return reactQueryClient.ensureQueryData(getProfileQueryConfig({ xmtpId }))
}

export const invalidateProfileQuery = ({ xmtpId }: { xmtpId: string }) => {
  reactQueryClient.invalidateQueries({
    queryKey: profileQueryKey({ xmtpId }),
  })
}

export const useProfilesQueries = ({ xmtpInboxIds }: { xmtpInboxIds: string[] | undefined }) => {
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

export const getProfileQueryData = ({ xmtpId }: { xmtpId: InboxId }) => {
  return reactQueryClient.getQueryData(getProfileQueryConfig({ xmtpId }).queryKey)
}
