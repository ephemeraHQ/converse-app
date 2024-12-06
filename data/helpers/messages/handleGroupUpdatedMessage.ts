import { handleGroupDescriptionUpdate } from "@/utils/groupUtils/handleGroupDescriptionUpdate";
import { handleGroupImageUpdate } from "@/utils/groupUtils/handleGroupImageUpdate";
import { handleGroupNameUpdate } from "@/utils/groupUtils/handleGroupNameUpdate";
import { invalidateGroupIsActiveQuery } from "@queries/useGroupIsActive";
import { invalidateGroupMembersQuery } from "@queries/useGroupMembersQuery";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { ConversationTopic, GroupUpdatedContent } from "@xmtp/react-native-sdk";

export const handleGroupUpdatedMessage = async (
  account: string,
  topic: ConversationTopic,
  message: DecodedMessageWithCodecsType
) => {
  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    // note(lustig): we could set the query data with the new information
    // rather than refetch. Refetching will be costly for larger groups

    // This will refresh members
    invalidateGroupMembersQuery(account, topic);
  }
  if (content.metadataFieldsChanged.length > 0) {
    let newGroupName = "";
    let newGroupPhotoUrl = "";
    let newGroupDescription = "";
    for (const field of content.metadataFieldsChanged) {
      if (field.fieldName === "group_name") {
        newGroupName = field.newValue;
      } else if (field.fieldName === "group_image_url_square") {
        newGroupPhotoUrl = field.newValue;
      } else if (field.fieldName === "description") {
        newGroupDescription = field.newValue;
      }
    }
    if (!!newGroupName) {
      handleGroupNameUpdate({ account, topic, name: newGroupName });
    }
    if (!!newGroupPhotoUrl) {
      handleGroupImageUpdate({ account, topic, image: newGroupPhotoUrl });
    }
    if (!!newGroupDescription) {
      handleGroupDescriptionUpdate({
        account,
        topic,
        description: newGroupDescription,
      });
    }
  }
  // Admin Update
  if (
    content.membersAdded.length === 0 &&
    content.membersRemoved.length === 0 &&
    content.metadataFieldsChanged.length === 0
  ) {
    invalidateGroupMembersQuery(account, topic);
    invalidateGroupIsActiveQuery(account, topic);
  }
};
