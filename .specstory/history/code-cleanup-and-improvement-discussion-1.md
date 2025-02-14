## SpecStory

## Code Cleanup and Improvement Discussion (2/18/2025, 12:07:25 PM)

_**User**_

clean

---

_**Assistant**_

I'll help clean up the code following the provided guidelines. Here are the main improvements:

1. Fix the type error with useProfilesQueries
2. Improve error handling with captureError
3. Improve function parameter patterns
4. Add more descriptive comments
5. Improve code organization

Here are the changes:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  useProfileQuery,
  useProfilesQueries,
} from "@/features/profiles/profiles.query";
import { translate } from "@/i18n";
import { captureError } from "@/utils/error";
import logger from "@/utils/logger";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { GroupUpdatedCodec, InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

// Handles group metadata changes (name, description, image) and returns appropriate translation
function handleGroupMetadataChange(args: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}) {
  const { initiatorName, content } = args;

  // If multiple fields changed, return generic update message
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

// Returns translated text for group member changes (add/remove)
function getGroupMemberChangeText(args: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
  memberProfiles: any[] | undefined;
}) {
  const { initiatorName, members, type, memberProfiles } = args;

  if (members.length === 0) return null;

  if (members.length === 1 && memberProfiles?.[0]) {
    const memberName = memberProfiles[0].name;

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

  // Get initiator profile for group updates
  const initiatorInboxId =
    message && isGroupUpdatedMessage(message)
      ? message.content().initiatedByInboxId
      : undefined;

  const { data: initiatorProfile } = useProfileQuery(initiatorInboxId);

  // Get member profiles for group updates
  const memberInboxIds = useMemo(() => {
    if (!message || !isGroupUpdatedMessage(message)) return [];
    
    const content = message.content();
    return [
      ...content.membersAdded.map((m) => m.inboxId),
      ...content.membersRemoved.map((m) => m.inboxId),
    ];
  }, [message]);

  // Fix type error by passing array of strings
  const { data: memberProfiles } = useProfilesQueries(
    memberInboxIds.length > 0 ? memberInboxIds : []
  );

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
        return translate("conversation_list.attachment");
      }

      // Handle group update messages
      if (isGroupUpdatedMessage(message)) {
        const content = message.content();
        const initiatorName = initiatorProfile?.name;

        if (!initiatorName) return translate("conversation_list.group_updated");

        if (content.metadataFieldsChanged.length > 0) {
          return handleGroupMetadataChange({
            initiatorName,
            content,
          });
        }

        const memberAddedText = getGroupMemberChangeText({
          initiatorName,
          members: content.membersAdded,
          type: "added",
          memberProfiles: memberProfiles?.slice(0, content.membersAdded.length),
        });

        if (memberAddedText) return memberAddedText;

        const memberRemovedText = getGroupMemberChangeText({
          initiatorName,
          members: content.membersRemoved,
          type: "removed",
          memberProfiles: memberProfiles?.slice(content.membersAdded.length),
        });

        if (memberRemovedText) return memberRemovedText;

        return translate("conversation_list.group_updated");
      }

      // Handle regular messages
      const content = message.content();
      return typeof content === "string" ? content : message.fallback;
    } catch (error) {
      const enhancedError = new Error(
        `Failed to get message text for content type ${message.contentTypeId}`
      );
      captureError(enhancedError, { error, contentTypeId: message.contentTypeId });
      logger.error(
        `Error getting message text for content type ${message.contentTypeId}: ${error}`
      );
      return message.fallback;
    }
  }, [message, account, initiatorProfile, memberProfiles]);
}
```

Key changes made:

1. Fixed the type error with useProfilesQueries by passing the array directly instead of an object with inboxIds
2. Added captureError for better error tracking
3. Improved comments to better explain the code flow
4. Improved error handling with more context
5. Simplified the memberInboxIds useMemo logic
6. Added proper type annotations for function parameters
7. Improved code organization with logical grouping
8. Maintained existing comments while adding more context where needed

The code now follows the provided guidelines while maintaining its functionality and improving its maintainability.

---



---

