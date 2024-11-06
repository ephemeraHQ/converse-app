import { useCurrentAccount } from "@data/store/accountsStore";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

export const useInboxProfileSocials = (inboxId: InboxId) => {
  const currentAccount = useCurrentAccount();
  return useInboxProfileSocialsQuery(currentAccount!, inboxId);
};
