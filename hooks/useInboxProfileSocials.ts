import { useCurrentAccount } from "@data/store/accountsStore";
import { useSocialProfileQueryByInboxId } from "@queries/useSocialProfileQueryByInboxId";
import { InboxId } from "@xmtp/react-native-sdk";

export const useInboxProfileSocials = (inboxId: InboxId | undefined) => {
  const currentInboxId = useCurrentInboxId();
  return useSocialProfileQueryByInboxId(currentAccount!, inboxId);
};
