import { refreshGroup } from "@utils/xmtpRN/conversations";
import { GroupUpdatedContent } from "@xmtp/react-native-sdk";

import { invalidateGroupMembersQuery } from "../../../queries/useGroupMembersQuery";
import { invalidateGroupNameQuery } from "../../../queries/useGroupNameQuery";
import { invalidateGroupPhotoQuery } from "../../../queries/useGroupPhotoQuery";
import { DecodedMessageWithCodecsType } from "../../../utils/xmtpRN/client";

export const handleGroupUpdatedMessage = async (
  account: string,
  topic: string,
  message: DecodedMessageWithCodecsType
) => {
  if (!message.contentTypeId.includes("group_updated")) return;
  const content = message.content() as GroupUpdatedContent;
  if (content.membersAdded.length > 0 || content.membersRemoved.length > 0) {
    // This will refresh members
    await refreshGroup(account, topic);
    invalidateGroupMembersQuery(account, topic);
  }
  if (content.metadataFieldsChanged.length > 0) {
    let groupNameChanged = false;
    let groupPhotoChanged = false;
    for (const field of content.metadataFieldsChanged) {
      if (field.fieldName === "group_name") {
        groupNameChanged = true;
      } else if (field.fieldName === "group_image_url_square") {
        groupPhotoChanged = true;
      }
    }
    if (groupNameChanged) {
      invalidateGroupNameQuery(account, topic);
    }
    if (groupPhotoChanged) {
      invalidateGroupPhotoQuery(account, topic);
    }
  }
  // Admin Update
  if (
    content.membersAdded.length === 0 &&
    content.membersRemoved.length === 0 &&
    content.metadataFieldsChanged.length === 0
  ) {
    invalidateGroupMembersQuery(account, topic);
  }
};
