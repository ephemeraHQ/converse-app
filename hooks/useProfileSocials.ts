import { useProfileSocialsQuery } from "@queries/useProfileSocialsQuery";

export const useProfileSocials = ({ peerInboxId }: { peerInboxId: string }) => {
  return useProfileSocialsQuery({
    profileLookupInboxId: peerInboxId,
  });
};
