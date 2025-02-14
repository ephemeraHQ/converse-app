## SpecStory

## Code Cleanup and Improvement Discussion (2/18/2025, 11:25:50 AM)

_**User**_

clean

---

_**Assistant**_

I'll help clean up the code following the provided guidelines. Here are the main improvements:

1. Import the missing `IProfileSocialsZodSchema` type
2. Reorganize imports
3. Add type annotations for function parameters
4. Add descriptive comments for complex logic
5. Improve error handling and logging

Here's the cleaned version:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { translate } from "@/i18n";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import {
  fetchInboxProfileSocialsQuery,
  getInboxProfileSocialsQueryData,
} from "@/queries/useInboxProfileSocialsQuery";
import { IProfileSocialsZodSchema } from "@/features/profile/profile.types";
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

// Handles group metadata changes (name, description, image) and returns appropriate translation
function handleGroupMetadataChange(args: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
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

// Handles group member changes (add/remove) and returns appropriate translation
function handleGroupMemberChange(args: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}) {
  const { initiatorName, members, type } = args;

  if (members.length === 0) return null;

  if (members.length === 1) {
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    });
    const memberName = getPreferredInboxAddress(
      memberSocials as IProfileSocialsZodSchema[] | null | undefined
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
      }).catch(captureError);
    });
  }, [message, account]);

  return useMemo(() => {
    if (!account || !message) return "";

    try {
      // Handle reply messages
      if (isReplyMessage(message)) {
        const content = (message as DecodedMessage<ReplyCodec>).content();
        return typeof content === "string" ? content : content.content.text;
      }

      // Handle attachment messages
      if (
        isStaticAttachmentMessage(message) ||
        isRemoteAttachmentMessage(message)
      ) {
        return translate("conversation_list.attachment");
      }

      // Handle group update messages
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

      // Handle regular messages
      const content = message.content();
      return typeof content === "string" ? content : message.fallback;
    } catch (error) {
      logger.error(
        `Error getting message text for content type ${message.contentTypeId}: ${error}`
      );
      return message.fallback;
    }
  }, [message, account]);
}
```

Key changes made:
1. Added missing `IProfileSocialsZodSchema` import
2. Reorganized imports by category (React, internal features, utils, external)
3. Converted helper functions to use object parameters
4. Added descriptive comments for complex logic sections
5. Improved error logging using template literals
6. Used function declarations instead of const assignments for functions
7. Added type annotations for function parameters
8. Improved variable names for clarity
9. Added spacing between logical blocks for better readability

---



---

