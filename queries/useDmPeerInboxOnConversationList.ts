import { ConversationVersion } from "@xmtp/react-native-sdk";
import { useQuery } from "@tanstack/react-query";
import { getDmPeerInbox } from "@utils/xmtpRN/contacts";
import { DmWithCodecsType } from "@utils/xmtpRN/client";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const dmPeerInboxQueryKey = (
  account: string,
  topic: ConversationTopic | undefined
) => ["dmPeerInbox", account, topic];

export const useDmPeerInboxOnConversationList = (
  account: string,
  dm: DmWithCodecsType
) => {
  return useQuery({
    queryKey: dmPeerInboxQueryKey(account, dm.topic),
    queryFn: () => {
      if (!dm) {
        throw new Error("Conversation not found");
      }
      if (dm.version !== ConversationVersion.DM) {
        throw new Error("Conversation is not a DM");
      }
      return getDmPeerInbox(dm);
    },
    enabled: !!dm && dm.version === ConversationVersion.DM,
  });
};
