import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

export const useInboxProfileSocials = (inboxId: InboxId | undefined) => {
  return useInboxProfileSocialsQuery(inboxId);
};
