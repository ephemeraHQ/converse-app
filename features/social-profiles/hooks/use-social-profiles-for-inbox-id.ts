import { InboxId } from "@xmtp/react-native-sdk";
import {
  getSafeCurrentSender,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store";
import {
  ensureSocialProfilesForEthAddresses,
  useSocialProfilesForEthAddressQueries,
} from "@/features/social-profiles/social-profiles.query";
import {
  ensureEthAddressForXmtpInboxId,
  useEthAddressesForXmtpInboxId,
} from "@/features/xmtp/xmtp-inbox-id/eth-addresses-for-xmtp-inbox-id.query";

export function useSocialProfilesForInboxId(args: {
  inboxId: InboxId | undefined;
}) {
  const { inboxId } = args;

  const currentSender = useSafeCurrentSender();

  const { data: ethAddresses, isLoading: isLoadingEthAddresses } =
    useEthAddressesForXmtpInboxId({
      inboxId,
      clientEthAddress: currentSender.ethereumAddress,
    });

  const { data: socialProfiles, isLoading: isLoadingSocialProfiles } =
    useSocialProfilesForEthAddressQueries({
      ethAddresses: ethAddresses ?? [],
    });

  return {
    data: socialProfiles.filter(Boolean).flat(),
    isLoading: isLoadingEthAddresses || isLoadingSocialProfiles,
  };
}

export async function getSocialProfilesForInboxId(args: { inboxId: InboxId }) {
  const { inboxId } = args;

  const currentSender = getSafeCurrentSender();

  const ethAddresses = await ensureEthAddressForXmtpInboxId({
    inboxId,
    clientEthAddress: currentSender.ethereumAddress,
  });

  if (!ethAddresses) {
    return [];
  }

  const socialProfiles = await ensureSocialProfilesForEthAddresses({
    ethAddresses: ethAddresses,
  });

  return socialProfiles;
}
