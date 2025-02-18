import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { translate } from "@/i18n";
import {
  fetchInboxProfileSocialsQuery,
  getInboxProfileSocialsQueryData,
} from "@/queries/useInboxProfileSocialsQuery";
import { captureError } from "@/utils/capture-error";
import { getPreferredInboxAddress } from "@/utils/profile";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { logger } from "@utils/logger";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  ReplyCodec,
} from "@xmtp/react-native-sdk";
import { useEffect, useMemo } from "react";

const handleGroupMetadataChange = (
  initiatorName: string,
  content: ReturnType<GroupUpdatedCodec["decode"]>
) => {
  if (content.metadataFieldsChanged.length !== 1) {
    return translate("conversation_list.updated_the_group", {
      userName: initiatorName,
    });
  }

  const change = content.metadataFieldsChanged[0];
  const translations: Record<string, string> = {
    group_name: translate("conversation_list.name_changed", {
      userName: initiatorName,
      newValue: change.newValue,
    }),
    description: translate("conversation_list.description_changed", {
      userName: initiatorName,
      newValue: change.newValue,
    }),
    group_image_url_square: translate("conversation_list.image_changed", {
      userName: initiatorName,
    }),
  };

  return (
    translations[change.fieldName] ||
    translate("conversation_list.updated_the_group", {
      userName: initiatorName,
    })
  );
};

const handleGroupMemberChange = (
  initiatorName: string,
  members: { inboxId: InboxId }[],
  type: "added" | "removed"
) => {
  if (members.length === 0) return null;

  if (members.length === 1) {
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    });
    const memberName = getPreferredInboxAddress(memberSocials);

    if (!memberName) {
      return translate(`conversation_list.member_${type}_unknown`, {
        userName: initiatorName,
      });
    }

    return translate(`conversation_list.member_${type}`, {
      userName: initiatorName,
      memberName,
    });
  }

  return translate(`conversation_list.members_${type}`, {
    userName: initiatorName,
    count: members.length,
  });
};

export const useMessagePlainText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  const account = useCurrentAccount();

  useEffect(() => {
    if (!message || !isGroupUpdatedMessage(message)) return;

    const content = message.content();
    const inboxIds = [
      content.initiatedByInboxId,
      ...content.membersAdded.map((m) => m.inboxId),
      ...content.membersRemoved.map((m) => m.inboxId),
    ];

    inboxIds.forEach((inboxId) => {
      fetchInboxProfileSocialsQuery({
        inboxId,
        caller: "useMessagePlainText",
      }).catch(captureError);
    });
  }, [message, account]);

  return useMemo(() => {
    if (!account || !message) return "";

    try {
      if (isReplyMessage(message)) {
        const content = (message as DecodedMessage<ReplyCodec>).content();
        return typeof content === "string" ? content : content.content.text;
      }

      if (
        isStaticAttachmentMessage(message) ||
        isRemoteAttachmentMessage(message)
      ) {
        return translate("conversation_list.attachment");
      }

      if (isGroupUpdatedMessage(message)) {
        const content = message.content();
        const initiatorSocials = getInboxProfileSocialsQueryData({
          inboxId: content.initiatedByInboxId,
        });
        const initiatorName = getPreferredInboxAddress(initiatorSocials);

        if (!initiatorName) return translate("conversation_list.group_updated");

        if (content.metadataFieldsChanged.length > 0) {
          return handleGroupMetadataChange(initiatorName, content);
        }

        const memberAddedText = handleGroupMemberChange(
          initiatorName,
          content.membersAdded,
          "added"
        );
        if (memberAddedText) return memberAddedText;

        const memberRemovedText = handleGroupMemberChange(
          initiatorName,
          content.membersRemoved,
          "removed"
        );
        if (memberRemovedText) return memberRemovedText;

        return translate("conversation_list.group_updated");
      }

      const content = message.content();
      return typeof content === "string" ? content : message.fallback;
    } catch (e) {
      logger.error("Error getting message text", {
        error: e,
        contentTypeId: message.contentTypeId,
      });
      return message.fallback;
    }
  }, [message, account]);
};
