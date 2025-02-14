## SpecStory

## Fixing Group Update Profile Queries (2/18/2025, 12:00:33 PM)

_**User**_

this needs to be fixed, because if it's a group update, we need to use useProfileQuery and pas the initailtedByInboxId and then we need to get the profikles of the memberAdded or removed using useProfilesQueries

---

_**Assistant**_

I'll help you modify the code to properly fetch profiles using `useProfileQuery` and `useProfilesQueries`. Here's how we should update the code:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { translate } from "@/i18n";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { captureError } from "@/utils/capture-error";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { logger } from "@utils/logger";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  ReplyCodec,
} from "@xmtp/react-native-sdk";
import { useEffect, useMemo } from "react";
import { useProfileQuery } from "@/queries/use-profile-query";
import { useProfilesQueries } from "@/queries/use-profiles-queries";
import { getPreferredProfileAddress } from "@/utils/profile";

// ... keep handleGroupMetadataChange function unchanged ...

function useGroupMemberChange(args: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}) {
  const { initiatorName, members, type } = args;
  const memberInboxIds = members.map(m => m.inboxId);
  const { data: memberProfiles } = useProfilesQueries({ inboxIds: memberInboxIds });

  if (members.length === 0) return null;

  if (members.length === 1 && memberProfiles?.[0]) {
    const memberName = getPreferredProfileAddress(memberProfiles[0]);

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
  const initiatorInboxId = isGroupUpdatedMessage(message) 
    ? message.content().initiatedByInboxId 
    : undefined;
  
  const { data: initiatorProfile } = useProfileQuery({
    inboxId: initiatorInboxId,
    enabled: !!initiatorInboxId,
  });

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
        const initiatorName = initiatorProfile 
          ? getPreferredProfileAddress(initiatorProfile)
          : undefined;

        if (!initiatorName) return translate("conversation_list.group_updated");

        if (content.metadataFieldsChanged.length > 0) {
          return handleGroupMetadataChange({
            initiatorName,
            content,
          });
        }

        const memberAddedText = useGroupMemberChange({
          initiatorName,
          members: content.membersAdded,
          type: "added",
        });

        if (memberAddedText) return memberAddedText;

        const memberRemovedText = useGroupMemberChange({
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
  }, [message, account, initiatorProfile]);
}
```

Key changes made:

1. Removed the dependency on `IProfileSocialsZodSchema` and related queries
2. Added `useProfileQuery` to fetch the initiator's profile for group updates
3. Created a new `useGroupMemberChange` hook that uses `useProfilesQueries` to fetch profiles for added/removed members
4. Updated the profile data access to use the new profile queries
5. Used `getPreferredProfileAddress` instead of `getPreferredInboxAddress`
6. Added initiatorProfile to the useMemo dependencies

The code now properly fetches profiles using the React Query hooks and handles the group update messages more efficiently. The profile data is fetched automatically when needed and the component will re-render with the correct information once the data is available.

---

_**User**_

you can't use ooks inside the useMemo

---

_**Assistant**_

You're right - we need to restructure the code to avoid using hooks inside the useMemo callback. Let's move the member change logic outside and use the profiles data directly.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { translate } from "@/i18n";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { captureError } from "@/utils/capture-error";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { logger } from "@utils/logger";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  ReplyCodec,
} from "@xmtp/react-native-sdk";
import { useEffect, useMemo } from "react";
import { useProfileQuery } from "@/queries/use-profile-query";
import { useProfilesQueries } from "@/queries/use-profiles-queries";
import { getPreferredProfileAddress } from "@/utils/profile";

// Keep handleGroupMetadataChange unchanged...

function getGroupMemberChangeText(args: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
  memberProfiles?: any[];
}) {
  const { initiatorName, members, type, memberProfiles } = args;

  if (members.length === 0) return null;

  if (members.length === 1 && memberProfiles?.[0]) {
    const memberName = getPreferredProfileAddress(memberProfiles[0]);

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
  const initiatorInboxId = isGroupUpdatedMessage(message) 
    ? message.content().initiatedByInboxId 
    : undefined;
  
  const { data: initiatorProfile } = useProfileQuery({
    inboxId: initiatorInboxId,
    enabled: !!initiatorInboxId,
  });

  // Get member profiles for group updates
  const memberInboxIds = useMemo(() => {
    if (!isGroupUpdatedMessage(message)) return [];
    const content = message.content();
    return [
      ...content.membersAdded.map(m => m.inboxId),
      ...content.membersRemoved.map(m => m.inboxId),
    ];
  }, [message]);

  const { data: memberProfiles } = useProfilesQueries({
<<<<<<< HEAD
    inboxIds: memberInboxIds,
    enabled: memberInboxIds.length > 0,
  });

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
        const initiatorName = initiatorProfile 
          ? getPreferredProfileAddress(initiatorProfile)
          : undefined;

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
      logger.error(
        `Error getting message text for content type ${message.contentTypeId}: ${error}`
      );
      return message.fallback;
    }
  }, [message, account, initiatorProfile, memberProfiles]);
}
```

Key changes:
1. Renamed `useGroupMemberChange` to `getGroupMemberChangeText` and made it a regular function that accepts member profiles as a parameter
2. Added `memberInboxIds` memo to collect all member IDs that need profiles
3. Added `useProfilesQueries` hook at the component level to fetch all needed profiles at once
4. Split the memberProfiles array between added and removed members when calling `getGroupMemberChangeText`
5. Added memberProfiles to the final useMemo dependencies

This restructuring avoids using hooks inside the useMemo callback while maintaining the same functionality. The profiles are now fetched at the component level and passed down to the text generation functions.
=======
>>>>>>> af720e95 (wip)

---



---

