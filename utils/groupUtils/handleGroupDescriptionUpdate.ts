import { setGroupDescriptionQueryData } from "@/queries/useGroupDescriptionQuery";
import { updateGroupDescriptionToConversationListQuery } from "@/queries/useV3ConversationListQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

type HandleGroupDescriptionUpdateParams = {
  account: string;
  topic: ConversationTopic;
  description: string;
};

export const handleGroupDescriptionUpdate = ({
  account,
  topic,
  description,
}: HandleGroupDescriptionUpdateParams) => {
  setGroupDescriptionQueryData(account, topic, description);
  updateGroupDescriptionToConversationListQuery({
    account,
    topic,
    description,
  });
};
