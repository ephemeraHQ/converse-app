## SpecStory

## Code Cleanup and Type Safety Improvements (2/18/2025, 11:18:41 AM)

_**User**_

clean

---

_**Assistant**_

I'll help clean up the code following the provided guidelines. The main issues to address are:

1. The missing `IProfileSocialsZodSchema` type
2. Improving code organization and readability
3. Following the logging guidelines
4. Improving type safety

Here are the suggested changes:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
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
  IProfileSocials,
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

// Types for group metadata changes
type GroupMetadataContent = ReturnType<GroupUpdatedCodec["decode"]>;
type GroupMemberChangeArgs = {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
};

function handleGroupMetadataChange(args: {
  initiatorName: string;
  content: GroupMetadataContent;
}) {
  const { initiatorName, content } = args;

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
}

function handleGroupMemberChange(args: GroupMemberChangeArgs) {
  const { initiatorName, members, type } = args;

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
}

export function useMessagePlainText(
  message: DecodedMessageWithCodecsType | undefined
) {
  const account = useCurrentAccount();

  // Fetch profile socials for group update messages
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
      }).catch((error) => {
        logger.error(`Failed to fetch profile socials for inboxId: ${inboxId}`, error);
        captureError(error);
      });
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
          return handleGroupMetadataChange({
            initiatorName,
            content,
          });
        }

        const memberAddedText = handleGroupMemberChange({
          initiatorName,
          members: content.membersAdded,
          type: "added",
        });
        if (memberAddedText) return memberAddedText;

        const memberRemovedText = handleGroupMemberChange({
          initiatorName,
          members: content.membersRemoved,
          type: "removed",
        });
        if (memberRemovedText) return memberRemovedText;

        return translate("conversation_list.group_updated");
      }

      const content = message.content();
      return typeof content === "string" ? content : message.fallback;
    } catch (error) {
      logger.error(`Error getting message text for contentTypeId: ${message.contentTypeId}`, error);
      return message.fallback;
    }
  }, [message, account]);
}
```

Key changes made:

1. Added proper type imports and removed the undefined `IProfileSocialsZodSchema` reference
2. Converted functions to use the `function` keyword and object parameters
3. Added proper type definitions for group metadata and member change arguments
4. Improved error logging using template literals
5. Improved code organization with better spacing and grouping
6. Made error handling more consistent
7. Added more descriptive error messages
8. Improved type safety throughout the code

The code is now cleaner, more type-safe, and follows the provided guidelines more closely.

---



---

