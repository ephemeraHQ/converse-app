## SpecStory

## Code Refactoring for Improved Readability (2/18/2025, 10:42:23 AM)

_**User**_

make this cleaner and more readble

---

_**Assistant**_

I'll refactor the code to make it cleaner and more readable. The main issues are:

1. The linter error shows we need to use `getPreferredInboxAddress` instead of `getPreferredInboxName`
2. The message content handling is too nested and complex
3. The group update message handling can be split into separate functions

Here's the refactored code:

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

const handleGroupMetadataChange = (
  initiatorName: string,
  content: ReturnType<GroupUpdatedCodec["decode"]>
) => {
  if (content.metadataFieldsChanged.length !== 1) {
    return translate("conversation_list.updated_the_group", { userName: initiatorName });
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

  return translations[change.fieldName] || 
    translate("conversation_list.updated_the_group", { userName: initiatorName });
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
      ...content.membersAdded.map(m => m.inboxId),
      ...content.membersRemoved.map(m => m.inboxId),
    ];

    inboxIds.forEach(inboxId => {
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

      if (isStaticAttachmentMessage(message) || isRemoteAttachmentMessage(message)) {
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
```

Key improvements:
1. Fixed the linter error by using `getPreferredInboxAddress` instead of `getPreferredInboxName`
2. Extracted group message handling into separate functions
3. Simplified the useEffect hook by using array methods
4. Made the control flow more linear with early returns
5. Reduced nesting levels
6. Added type safety for group message translations
7. Improved code reuse for member added/removed handling

The code is now more maintainable and easier to understand while keeping the same functionality.

---

_**User**_

curious here, in my rules for cursur i said I always prefer args:{} and still you didn't listen. why so? can't you read my rules?

---

_**Assistant**_

I don't see any rules about preferring `args:{}` in the instructions you provided. The custom instructions you shared focus on being terse, direct, casual, treating you as an expert, etc., but don't mention anything about argument formatting preferences.

If you have a preference for `args:{}` style, I'll be happy to update the code. Here's how those parts should look:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

const handleGroupMetadataChange = ({
  initiatorName,
  content,
}: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}) => {
  // ... rest of function
};

const handleGroupMemberChange = ({
  initiatorName,
  members,
  type,
}: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}) => {
  // ... rest of function
};

// ... rest of the file
```

Please let me know if you'd like me to update the entire file with this style.

---

_**User**_

I didn'T mention it in my instructions but when i ask something you go look in my .cursor/rules folder no?

---

_**Assistant**_

No, I don't have access to your `.cursor/rules` folder or any local files unless you explicitly share them in the conversation. I can only see:

1. The files you directly share in the conversation
2. The custom instructions you provide
3. Any other context you explicitly share

If you have specific formatting preferences or rules in your `.cursor/rules` folder, you'll need to share those with me or include them in the custom instructions. Once you do, I'll make sure to follow them consistently.

---



---

