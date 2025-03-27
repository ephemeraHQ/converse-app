import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, useQueries } from "@tanstack/react-query"
import {
  getPreferredAvatarUrl,
  getPreferredDisplayName,
  getPreferredEthAddress,
} from "@/features/preferred-display-info/preferred-display-info.utils"
import { getProfileQueryConfig } from "@/features/profiles/profiles.query"
import { getSocialProfilesForInboxId } from "@/features/social-profiles/hooks/use-social-profiles-for-inbox-id"

export function usePreferredDisplayInfoBatch(args: { xmtpInboxIds: IXmtpInboxId[] }) {
  const { xmtpInboxIds } = args

  const profileQueries = useQueries({
    queries: xmtpInboxIds.map((inboxId) => ({
      ...getProfileQueryConfig({ xmtpId: inboxId }),
    })),
  })

  const socialProfileQueries = useQueries({
    queries: xmtpInboxIds.map((inboxId) =>
      queryOptions({
        queryKey: ["social-profiles", inboxId],
        queryFn: () => getSocialProfilesForInboxId({ inboxId }),
      }),
    ),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      error: results.find((result) => result.error)?.error,
    }),
  })

  return xmtpInboxIds.map((inboxId, index) => {
    const profileQuery = profileQueries[index]

    const socialProfiles = socialProfileQueries.data[index]

    const displayName = getPreferredDisplayName({
      profile: profileQuery?.data,
      socialProfiles,
      inboxId,
      ethAddress: profileQuery.data?.privyAddress,
    })

    const avatarUrl = getPreferredAvatarUrl({
      profile: profileQuery?.data,
      socialProfiles,
    })

    const ethAddress = getPreferredEthAddress({
      profile: profileQuery?.data,
      socialProfiles,
      ethAddress: profileQuery.data?.privyAddress,
    })

    const username = profileQuery?.data?.username

    return {
      ethAddress,
      inboxId,
      displayName,
      avatarUrl,
      username,
      isLoading: profileQuery?.isLoading || socialProfileQueries.isLoading,
    }
  })
}
