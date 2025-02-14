## SpecStory

## Code Refactoring for Message Handling (2/18/2025, 10:58:20 AM)

_**User**_

clean

---

_**Assistant**_

I'll help analyze the code. The `useMessagePlainText.ts` file contains a hook that extracts plain text content from different types of messages in a conversation system. The code is well-structured but could benefit from some improvements:

1. Let's extract the group-related handlers into a separate utility file for better organization:

```typescript:features/conversation-list/hooks/group-message-handlers.ts
import { translate } from "@/i18n";
import { getInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import { getPreferredInboxAddress } from "@/utils/profile";
import { GroupUpdatedCodec, InboxId } from "@xmtp/react-native-sdk";

export const handleGroupMetadataChange = ({
  initiatorName,
  content,
}: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}) => {
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

export const handleGroupMemberChange = ({
  initiatorName,
  members,
  type,
}: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}) => {
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
```

2. Now let's update the main hook file to use these extracted handlers:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

import { handleGroupMetadataChange, handleGroupMemberChange } from "./group-message-handlers";

export const useMessagePlainText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  // ... existing code ...

  return useMemo(() => {
    if (!account || !message) return "";

    try {
      // ... existing code until isGroupUpdatedMessage check ...

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

      // ... rest of existing code ...
    } catch (e) {
      // ... existing error handling ...
    }
  }, [message, account]);
};
```

These changes:

1. Extract the group-related message handling logic into a separate file for better maintainability
2. Keep the core message processing logic in the main hook
3. Make the code more modular and easier to test
4. Improve readability by separating concerns

The functionality remains the same, but the code structure is now cleaner and more maintainable.

---



---

