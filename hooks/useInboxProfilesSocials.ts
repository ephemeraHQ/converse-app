import { useCurrentInboxId } from "@/data/store/accountsStore";
import { useInboxProfileSocialsQueries } from "@/queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

export const useInboxProfilesSocials = (inboxIds: InboxId[]) => {
  const currentInboxId = useCurrentInboxId();
  return useInboxProfileSocialsQueries({
    currentInboxId: currentInboxId!,
    profileLookupInboxIds: inboxIds,
  });
};
