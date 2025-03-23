import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import {
  getSafeCurrentSender,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import {
  ensureSocialProfilesForAddressesQuery,
  useSocialProfilesForEthAddressQueries,
} from "@/features/social-profiles/social-profiles.query"
import {
  ensureEthAddressesForXmtpInboxIdQueryData,
  useEthAddressesForXmtpInboxIdQuery,
} from "@/features/xmtp/xmtp-inbox-id/eth-addresses-for-xmtp-inbox-id.query"

export function useSocialProfilesForInboxId(args: { inboxId: IXmtpInboxId | undefined }) {
  const { inboxId } = args

  const currentSender = useSafeCurrentSender()

  const { data: ethAddresses, isLoading: isLoadingEthAddresses } =
    useEthAddressesForXmtpInboxIdQuery({
      inboxId,
      clientInboxId: currentSender.inboxId,
    })

  const { data: socialProfiles, isLoading: isLoadingSocialProfiles } =
    useSocialProfilesForEthAddressQueries({
      ethAddresses: ethAddresses ?? [],
    })

  return {
    data: socialProfiles.filter(Boolean).flat(),
    isLoading: isLoadingEthAddresses || isLoadingSocialProfiles,
  }
}

export async function getSocialProfilesForInboxId(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  const currentSender = getSafeCurrentSender()

  const ethAddresses = await ensureEthAddressesForXmtpInboxIdQueryData({
    inboxId,
    clientInboxId: currentSender.inboxId,
  })

  if (!ethAddresses) {
    return []
  }

  const socialProfiles = await ensureSocialProfilesForAddressesQuery({
    ethAddresses: ethAddresses.map((ethAddress) => ethAddress),
  })

  return socialProfiles
}
