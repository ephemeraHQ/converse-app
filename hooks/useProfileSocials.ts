import { useProfileSocialsQuery } from "@queries/useProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

export const useProfileSocials = ({ inboxId }: { inboxId: InboxId }) => {
  return useProfileSocialsQuery({
    profileLookupInboxId: inboxId,
  });
};
