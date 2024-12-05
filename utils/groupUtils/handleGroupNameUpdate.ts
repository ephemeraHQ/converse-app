import { setGroupNameQueryData } from "@/queries/useGroupNameQuery";
import { updateGroupNameToConversationListQuery } from "@/queries/useV3ConversationListQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

type HandleGroupNameUpdateParams = {
  account: string;
  topic: ConversationTopic;
  name: string;
};

export const handleGroupNameUpdate = ({
  account,
  topic,
  name,
}: HandleGroupNameUpdateParams) => {
  setGroupNameQueryData(account, topic, name);
  updateGroupNameToConversationListQuery({ account, topic, name });
};
