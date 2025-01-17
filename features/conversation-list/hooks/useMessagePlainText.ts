import { useCurrentAccount } from "@/data/store/accountsStore";
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
import { getPreferredInboxName } from "@/utils/profile";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client/client.types";
import logger from "@utils/logger";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  ReplyCodec,
} from "@xmtp/react-native-sdk";
import { useEffect, useMemo } from "react";

export const useMessagePlainText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  const account = useCurrentAccount();

  // Not sure why we have this. Fixed the typing but need to check why it's needed.
  // I guess it's to make sure we have the data to display the people's name in group?
  // But we might have a better solution for that
  useEffect(() => {
    if (!message) {
      return;
    }

    if (isGroupUpdatedMessage(message)) {
      // TODO: check why we need to cast here. We should not need to do this since we have type guards
      const messageTyped = message as DecodedMessage<GroupUpdatedCodec>;
      const inboxIds: InboxId[] = [];
      const content = messageTyped.content();
      inboxIds.push(content.initiatedByInboxId);
      content.membersAdded.forEach((member) => {
        inboxIds.push(member.inboxId);
      });
      content.membersRemoved.forEach((member) => {
        inboxIds.push(member.inboxId);
      });
      if (inboxIds.length > 0) {
        for (const inboxId of inboxIds) {
          fetchInboxProfileSocialsQuery(account!, inboxId).catch(captureError);
        }
      }
    }
  }, [message, account]);

  return useMemo(() => {
    if (!account) return "";
    if (!message) return "";

    try {
      if (isReplyMessage(message)) {
        const messageTyped = message as DecodedMessage<ReplyCodec>;
        const content = messageTyped.content();

        if (typeof content === "string") {
          return content;
        }
        return content.content.text;
      }

      if (
        isStaticAttachmentMessage(message) ||
        isRemoteAttachmentMessage(message)
      ) {
        return translate("conversation_list.attachment");
      }

      const content = message?.content();
      if (isGroupUpdatedMessage(message)) {
        const content = message.content();
        const initiatorSocials = getInboxProfileSocialsQueryData(
          account,
          content.initiatedByInboxId
        );
        const initiatorName = getPreferredInboxName(initiatorSocials);
        if (!initiatorName) return translate("conversation_list.group_updated");
        if (content.metadataFieldsChanged.length > 0) {
          if (content.metadataFieldsChanged.length === 1) {
            switch (content.metadataFieldsChanged[0].fieldName) {
              case "group_name":
                return translate("conversation_list.name_changed", {
                  userName: initiatorName,
                  newValue: content.metadataFieldsChanged[0].newValue,
                });

              case "description":
                return translate("conversation_list.description_changed", {
                  userName: initiatorName,
                  newValue: content.metadataFieldsChanged[0].newValue,
                });
              case "group_image_url_square":
                return translate("conversation_list.image_changed", {
                  userName: initiatorName,
                });

              default:
                return translate("conversation_list.updated_the_group", {
                  userName: initiatorName,
                });
            }
          }
          return translate("conversation_list.updated_the_group", {
            userName: initiatorName,
          });
        }
        if (content.membersAdded.length > 0) {
          if (content.membersAdded.length === 1) {
            const memberSocials = getInboxProfileSocialsQueryData(
              account,
              content.membersAdded[0].inboxId
            );
            const memberName = getPreferredInboxName(memberSocials);
            if (!memberName)
              return translate("conversation_list.member_added_unknown", {
                userName: initiatorName,
              });
            return translate("conversation_list.member_added", {
              userName: initiatorName,
              memberName: memberName,
            });
          }
          return translate("conversation_list.members_added", {
            userName: initiatorName,
            count: content.membersAdded.length,
          });
        }
        if (content.membersRemoved.length > 0) {
          if (content.membersRemoved.length === 1) {
            const memberSocials = getInboxProfileSocialsQueryData(
              account,
              content.membersRemoved[0].inboxId
            );
            const memberName = getPreferredInboxName(memberSocials);
            if (!memberName)
              return translate("conversation_list.member_removed_unknown", {
                userName: initiatorName,
              });
            return translate("conversation_list.member_removed", {
              userName: initiatorName,
              memberName: memberName,
            });
          }
          return translate("conversation_list.members_removed", {
            userName: initiatorName,
            count: content.membersRemoved.length,
          });
        }

        return translate("conversation_list.group_updated");
      }
      if (typeof content === "string") {
        return content;
      }

      return message?.fallback;
    } catch (e) {
      logger.error("Error getting message text", {
        error: e,
        contentTypeId: message.contentTypeId,
      });
      return message.fallback;
    }
  }, [message, account]);
};
