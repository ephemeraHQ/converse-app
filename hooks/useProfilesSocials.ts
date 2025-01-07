import { useCurrentInboxId } from "@data/store/accountsStore";
import { useProfileSocialsQueries } from "@queries/useProfileSocialsQuery";

/**
 * @param peerAddresses Use multiple peer addresses to get their socials
 */
export const useProfilesSocials = ({
  peerInboxIds,
}: {
  peerInboxIds: string[];
}) => {
  const currentInboxId = useCurrentInboxId();
  return useProfileSocialsQueries({
    currentInboxId: currentInboxId!,
    peerInboxIds,
  });
};
