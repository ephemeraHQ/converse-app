import { useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getPreferredAvatarUrl,
  getPreferredDisplayName,
  getPreferredEthAddress,
} from "@/features/preferred-display-info/preferred-display-info.utils"
import { useProfileQuery } from "@/features/profiles/profiles.query"
import { useSocialProfilesForInboxId } from "@/features/social-profiles/hooks/use-social-profiles-for-inbox-id"
import { useEthAddressesForXmtpInboxId } from "@/features/xmtp/xmtp-inbox-id/eth-addresses-for-xmtp-inbox-id.query"
import { getXmtpInboxIdFromEthAddressQueryOptions } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query"
import { IEthereumAddress } from "@/utils/evm/address"

// At least one of these properties must be defined
type PreferredDisplayInfoArgs =
  | {
      inboxId: InboxId | undefined
      ethAddress?: IEthereumAddress
    }
  | {
      inboxId?: InboxId
      ethAddress: IEthereumAddress | undefined
    }

export function usePreferredDisplayInfo(args: PreferredDisplayInfoArgs) {
  const { inboxId: inboxIdArg, ethAddress: ethAddressArg } = args

  const currentSender = useSafeCurrentSender()

  const { data: inboxIdFromEthAddress } = useQuery({
    ...getXmtpInboxIdFromEthAddressQueryOptions({
      clientEthAddress: currentSender.ethereumAddress,
      targetEthAddress: ethAddressArg!, // ! because we check enabled
    }),
    enabled: !!ethAddressArg,
  })

  const inboxId = inboxIdArg ?? inboxIdFromEthAddress

  const { data: ethAddressesForXmtpInboxId } = useEthAddressesForXmtpInboxId({
    clientEthAddress: currentSender.ethereumAddress,
    inboxId,
  })

  // Get Convos profile data
  const { data: profile, isLoading: isLoadingProfile } = useProfileQuery({
    xmtpId: inboxId,
  })

  // Get social profiles data
  const { data: socialProfiles, isLoading: isLoadingSocialProfiles } = useSocialProfilesForInboxId({
    inboxId,
  })

  const ethAddress = ethAddressArg || ethAddressesForXmtpInboxId?.[0]

  const displayName = getPreferredDisplayName({
    profile,
    socialProfiles,
    ethAddress,
    inboxId,
  })

  const avatarUrl = getPreferredAvatarUrl({
    profile,
    socialProfiles,
  })

  const preferredEthAddress = getPreferredEthAddress({
    profile,
    socialProfiles,
    ethAddress,
  })

  const preferredUsername = profile?.username

  return {
    displayName,
    avatarUrl,
    username: preferredUsername,
    ethAddress: preferredEthAddress,
    isLoading: isLoadingProfile || isLoadingSocialProfiles,
  }
}
