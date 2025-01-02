import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import logger from "@utils/logger";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { DecodedMessage, InboxId, ReplyCodec } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { translate } from "@/i18n";
import {
  getInboxProfileSocialsQueryData,
  useInboxProfileSocialsQueries,
} from "@/queries/useInboxProfileSocialsQuery";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { getPreferredInboxName } from "@/utils/profile";

export const useMessageText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  const account = useCurrentAccount();

  const inboxIds = useMemo(() => {
    if (!message) return [];
    if (isGroupUpdatedMessage(message)) {
      const idsToFetch: InboxId[] = [];
      const content = message.content();
      idsToFetch.push(content.initiatedByInboxId);
      content.membersAdded.forEach((member) => {
        idsToFetch.push(member.inboxId);
      });
      content.membersRemoved.forEach((member) => {
        idsToFetch.push(member.inboxId);
      });
      return idsToFetch;
    }
    return [];
  }, [message]);
  useInboxProfileSocialsQueries(account!, inboxIds);

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
