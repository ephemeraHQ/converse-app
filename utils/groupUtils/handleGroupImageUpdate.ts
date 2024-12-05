import { setGroupPhotoQueryData } from "@/queries/useGroupPhotoQuery";
import { updateGroupImageToConversationListQuery } from "@/queries/useV3ConversationListQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

type HandleGroupImageUpdateParams = {
  account: string;
  topic: ConversationTopic;
  image: string;
};

export const handleGroupImageUpdate = ({
  account,
  topic,
  image,
}: HandleGroupImageUpdateParams) => {
  setGroupPhotoQueryData(account, topic, image);
  updateGroupImageToConversationListQuery({ account, topic, image });
};
