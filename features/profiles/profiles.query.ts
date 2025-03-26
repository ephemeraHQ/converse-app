import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQueries, useQuery } from "@tanstack/react-query"
import { fetchProfile } from "@/features/profiles/profiles.api"
import { Optional } from "@/types/general"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IProfileQueryData = Awaited<ReturnType<typeof fetchProfile>>

type IArgs = {
  xmtpId: IXmtpInboxId | undefined
}

type IArgsWithCaller = IArgs & {
  caller: string
}

export const getProfileQueryConfig = (args: Optional<IArgsWithCaller, "caller">) => {
  const { xmtpId, caller } = args
  const enabled = !!xmtpId
  return queryOptions({
    meta: {
      caller,
    },
    enabled,
    queryKey: ["profile", xmtpId],
    queryFn: enabled ? () => fetchProfile({ xmtpId }) : skipToken,
  })
}

export const useProfileQuery = (args: IArgsWithCaller) => {
  return useQuery(getProfileQueryConfig(args))
}

export const setProfileQueryData = (args: IArgs & { profile: IProfileQueryData }) => {
  const { profile } = args
  return reactQueryClient.setQueryData(getProfileQueryConfig(args).queryKey, profile)
}

export function updateProfileQueryData(args: IArgs & { data: Partial<IProfileQueryData> }) {
  const { data } = args
  return reactQueryClient.setQueryData(getProfileQueryConfig(args).queryKey, (oldData) => {
    if (!oldData) {
      return oldData
    }
    return {
      ...oldData,
      ...data,
    }
  })
}
export const ensureProfileQueryData = (args: IArgsWithCaller) => {
  return reactQueryClient.ensureQueryData(getProfileQueryConfig(args))
}

export const invalidateProfileQuery = (args: IArgsWithCaller) => {
  return reactQueryClient.invalidateQueries({
    queryKey: getProfileQueryConfig(args).queryKey,
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

export const getProfileQueryData = (args: IArgs) => {
  return reactQueryClient.getQueryData(getProfileQueryConfig(args).queryKey)
}
