import { useCurrentInboxId } from "@data/store/accountsStore";
import { useProfileSocialsQueries } from "@queries/useProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

/**
 * @param peerAddresses Use multiple peer addresses to get their socials
 */
export const useProfilesSocials = ({
  peerInboxIds,
}: {
  peerInboxIds: InboxId[];
}) => {
  const currentInboxId = useCurrentInboxId();
  return useProfileSocialsQueries({
    currentInboxId: currentInboxId!,
    peerInboxIds,
  });
};
