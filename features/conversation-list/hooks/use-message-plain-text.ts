import { GroupUpdatedCodec } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import {
  useProfileQuery,
  useProfilesQueries,
} from "@/features/profiles/profiles.query";
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types";
import logger from "@/utils/logger";

// Handles group metadata changes (name, description, image)
function handleGroupMetadataChange(args: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}) {
  const { initiatorName, content } = args;

  if (content.metadataFieldsChanged.length !== 1) {
    return `${initiatorName} updated the group`;
  }

  const change = content.metadataFieldsChanged[0];

  switch (change.fieldName) {
    case "group_name":
      return `${initiatorName} changed group name to ${change.newValue}`;
    case "description":
      return `${initiatorName} changed description to ${change.newValue}`;
    case "group_image_url_square":
      return `${initiatorName} changed group image`;
    default:
      return `${initiatorName} updated the group`;
  }
}

export function useMessagePlainText(message: IXmtpDecodedMessage | undefined) {
  const account = useCurrentSenderEthAddress();

  // Get initiator profile for group updates
  const initiatorInboxId =
    message && isGroupUpdatedMessage(message)
      ? message.content().initiatedByInboxId
      : undefined;

  const { data: initiatorProfile } = useProfileQuery({
    xmtpId: initiatorInboxId,
  });

  // Get member profiles for group updates - split into added and removed
  const { addedMemberInboxIds, removedMemberInboxIds } = useMemo(() => {
    if (!message || !isGroupUpdatedMessage(message)) {
      return { addedMemberInboxIds: [], removedMemberInboxIds: [] };
    }
    const content = message.content();
    return {
      addedMemberInboxIds: content.membersAdded.map((m) => m.inboxId),
      removedMemberInboxIds: content.membersRemoved.map((m) => m.inboxId),
    };
  }, [message]);

  const { data: addedMemberProfiles } = useProfilesQueries({
    xmtpInboxIds: addedMemberInboxIds,
  });
  const { data: removedMemberProfiles } = useProfilesQueries({
    xmtpInboxIds: removedMemberInboxIds,
  });

  return useMemo(() => {
    if (!account || !message) return "";

    try {
      // Handle reply messages
      if (isReplyMessage(message)) {
        const content = message.content();
        return typeof content === "string" ? content : content.content.text;
      }

      // Handle attachment messages
      if (
        isStaticAttachmentMessage(message) ||
        isRemoteAttachmentMessage(message)
      ) {
        return "Attachment";
      }

      // Handle group update messages
      if (isGroupUpdatedMessage(message)) {
        const content = message.content();
        const initiatorName = initiatorProfile?.name ?? "Someone";

        // Handle metadata changes
        if (content.metadataFieldsChanged.length > 0) {
          return handleGroupMetadataChange({
            initiatorName,
            content,
          });
        }

        // Handle member changes
        if (content.membersAdded.length > 0) {
          const memberName = addedMemberProfiles?.[0]?.name ?? "someone";
          return content.membersAdded.length === 1
            ? `${initiatorName} added ${memberName}`
            : `${initiatorName} added ${content.membersAdded.length} members`;
        }

        if (content.membersRemoved.length > 0) {
          const memberName = removedMemberProfiles?.[0]?.name ?? "someone";
          return content.membersRemoved.length === 1
            ? `${initiatorName} removed ${memberName}`
            : `${initiatorName} removed ${content.membersRemoved.length} members`;
        }

        return "Group updated";
      }

      // Handle regular messages
      const content = message.content();
      return typeof content === "string" ? content : message.fallback;
    } catch (error) {
      logger.error(
        `Error getting message text for content type ${message.contentTypeId}: ${error}`,
      );
      return message.fallback;
    }
  }, [
    message,
    account,
    initiatorProfile,
    addedMemberProfiles,
    removedMemberProfiles,
  ]);
}
