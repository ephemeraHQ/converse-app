## SpecStory

## Code Cleanup and Improvement Discussion (2/18/2025, 11:11:34 AM)

_**User**_

clean

---

_**Assistant**_

I'll help clean up the code following the provided guidelines. The main issues to address are:

1. The missing `IProfileSocialsZodSchema` type
2. Improving code organization and readability
3. Applying functional programming patterns
4. Improving error handling and logging

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
import { IProfileSocials } from "@/features/profile/profile.types";

type GroupMetadataChangeArgs = {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
};

type GroupMemberChangeArgs = {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
};

// Handles changes to group metadata like name, description, or image
function handleGroupMetadataChange({ initiatorName, content }: GroupMetadataChangeArgs) {
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

// Handles changes to group membership (adding/removing members)
function handleGroupMemberChange({ initiatorName, members, type }: GroupMemberChangeArgs) {
  if (members.length === 0) return null;

  if (members.length === 1) {
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    });
    const memberName = getPreferredInboxAddress(
      memberSocials as IProfileSocials[] | null | undefined
    );

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

// Gets plain text content from different message types
function getMessageContent(message: DecodedMessageWithCodecsType) {
  if (isReplyMessage(message)) {
    const content = (message as DecodedMessage<ReplyCodec>).content();
    return typeof content === "string" ? content : content.content.text;
  }

  if (isStaticAttachmentMessage(message) || isRemoteAttachmentMessage(message)) {
    return translate("conversation_list.attachment");
  }

  const content = message.content();
  return typeof content === "string" ? content : message.fallback;
}

export function useMessagePlainText(message: DecodedMessageWithCodecsType | undefined) {
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
        logger.error(`Failed to fetch inbox profile socials: ${error}`);
        captureError(error);
      });
    });
  }, [message, account]);

  return useMemo(() => {
    if (!account || !message) return "";

    try {
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

      return getMessageContent(message);
    } catch (error) {
      logger.error(
        `Error getting message text for contentTypeId: ${message.contentTypeId}. Error: ${error}`
      );
      return message.fallback;
    }
  }, [message, account]);
}
```

Key changes made:

1. Added import for `IProfileSocials` type to replace the missing `IProfileSocialsZodSchema`
2. Extracted helper functions outside the hook for better organization
3. Added type definitions for function arguments
4. Improved error handling with more descriptive error messages
5. Improved logging using template literals
6. Extracted message content handling into a separate function
7. Added more descriptive variable names
8. Improved code organization with logical grouping
9. Added comments for complex logic sections
10. Used function declarations instead of const arrow functions for pure functions

The code is now more organized, type-safe, and follows the provided guidelines while maintaining its functionality.

---



---

