import { getCurrentInboxId } from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function getConversationForCurrentInboxByTopic(
  topic: ConversationTopic
) {
  const currentInboxId = getCurrentInboxId();
  return getConversationQueryData({
    inboxId: currentInboxId,
    topic: topic,
  });
}
