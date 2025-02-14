## SpecStory

## Code Simplification for Group Message Handling (2/18/2025, 12:10:11 PM)

_**User**_

remove the tralsation and "getGroupMemberChangeText" seems overkill

---

_**Assistant**_

I'll help simplify the code by removing the translation layer and refactoring the group member change handling. Here's the updated code:

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
import logger from "@/utils/logger";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { GroupUpdatedCodec } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

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

  const { data: memberProfiles } = useProfilesQueries(memberInboxIds);

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
          const memberName = memberProfiles?.[0]?.name ?? "someone";
          return content.membersAdded.length === 1
            ? `${initiatorName} added ${memberName}`
            : `${initiatorName} added ${content.membersAdded.length} members`;
        }

        if (content.membersRemoved.length > 0) {
          const memberName = memberProfiles?.[content.membersAdded.length]?.name ?? "someone";
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
        `Error getting message text for content type ${message.contentTypeId}: ${error}`
      );
      return message.fallback;
    }
  }, [message, account, initiatorProfile, memberProfiles]);
}
```

Key changes made:
1. Removed the translation layer for simpler, direct string messages
2. Removed the separate `getGroupMemberChangeText` function and integrated its logic directly into the main flow
3. Simplified the group metadata change handling with a switch statement
4. Added fallback text ("Someone", "someone") when names are not available
5. Streamlined the member addition/removal text generation

The code now handles the same cases but with less complexity while maintaining readability. The messages are now in plain English, but you can easily wrap them in translation calls if needed later.

---

_**User**_

we should separate the memberInboxIds removed and added and have 2 useProfilesQueries for both addedMembersProfiles and removeMembersProfiles i think

---

_**Assistant**_

Yes, that's a good suggestion. It will make the code clearer and prevent potential indexing issues. Here's how we can update the code:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing imports remain the same

// ... handleGroupMetadataChange function remains the same

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

  const { data: addedMemberProfiles } = useProfilesQueries(addedMemberInboxIds);
  const { data: removedMemberProfiles } = useProfilesQueries(removedMemberInboxIds);

  return useMemo(() => {
    if (!account || !message) return "";

    try {
      // ... existing reply and attachment message handling remains the same

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

      // ... existing regular message handling remains the same
    } catch (error) {
      logger.error(
        `Error getting message text for content type ${message.contentTypeId}: ${error}`
      );
      return message.fallback;
    }
  }, [message, account, initiatorProfile, addedMemberProfiles, removedMemberProfiles]);
}
```

Key changes made:
1. Split the member inbox IDs into separate arrays for added and removed members
2. Created two separate `useProfilesQueries` calls for added and removed members
3. Updated the member name references to use the correct profile arrays
4. Updated the dependency array in the final useMemo to include both profile arrays

This change makes the code more maintainable and prevents potential bugs from incorrect array indexing when trying to access removed member profiles.

---



---

