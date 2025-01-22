import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

export const useInboxProfilesSocials = (inboxIds: InboxId[]) => {
  return useInboxProfileSocialsQueries(inboxIds);
};
