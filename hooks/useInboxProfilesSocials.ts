import { useCurrentAccount } from "@data/store/accountsStore";
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

export const useInboxProfilesSocials = (inboxIds: InboxId[]) => {
  const currentAccount = useCurrentAccount();
  return useInboxProfileSocialsQueries(currentAccount!, inboxIds);
};
