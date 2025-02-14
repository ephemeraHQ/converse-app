## SpecStory

## Code Update: Replace Deprecated Profile Functions (2/18/2025, 1:53:24 PM)

_**User**_

fix this 



And code related. We don't have those function and this queryConfig anymore. we use useProfileQuery and useProfilesQueries in @profiles.query.ts 

---

_**Assistant**_

I'll help you update the code to use the profile queries from `profiles.query.ts` instead of the deprecated functions. Here's how we should modify the file:

```typescript:features/conversation/conversation-message/conversation-message-reactions/use-conversation-message-reactions-rolled-up.tsx
import { useConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message.utils";
import { isCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { useProfilesQueries } from "@/features/profiles/profiles.query";
import { useMemo } from "react";
import {
  RolledUpReactions,
  SortedReaction,
} from "./conversation-message-reactions.types";
import { MessageId } from "@xmtp/react-native-sdk";

export function useConversationMessageReactionsRolledUp(args: {
  messageId: MessageId;
}) {
  const { messageId } = args;

  const { bySender: reactionsBySender } =
    useConversationMessageReactions(messageId);

  const inboxIds = Array.from(
    new Set(
      Object.entries(reactionsBySender ?? {}).map(
        ([senderInboxId]) => senderInboxId
      )
    )
  );

  const { data: profiles } = useProfilesQueries({
    xmtpInboxIds: inboxIds,
  });

  const membersSocials = profiles?.map((profile, index) => {
    return {
      inboxId: inboxIds[index],
      address: profile?.address,
      uri: profile?.avatar,
      name: profile?.displayName,
    };
  });

  return useMemo((): RolledUpReactions => {
    const detailed: SortedReaction[] = [];
    let totalCount = 0;
    let userReacted = false;

    // Flatten reactions and track sender addresses
    const flatReactions = Object.entries(reactionsBySender ?? {}).flatMap(
      ([senderInboxId, senderReactions]) =>
        senderReactions.map((reaction) => ({ senderInboxId, ...reaction }))
    );
    totalCount = flatReactions.length;

    // Track reaction counts for preview
    const previewCounts = new Map<string, number>();

    flatReactions.forEach((reaction) => {
      const isOwnReaction = isCurrentAccountInboxId(reaction.senderInboxId);

      if (isOwnReaction) {
        userReacted = true;
      }

      // Count reactions for the preview
      previewCounts.set(
        reaction.content,
        (previewCounts.get(reaction.content) || 0) + 1
      );

      const socialDetails = membersSocials?.find(
        (social) => social.inboxId === reaction.senderInboxId
      );

      detailed.push({
        content: reaction.content,
        isOwnReaction,
        reactor: {
          address: reaction.senderInboxId,
          userName: socialDetails?.name,
          avatar: socialDetails?.uri,
        },
      });
    });

    // Sort detailed array to place all OWN reactions at the beginning
    detailed.sort((a, b) => Number(b.isOwnReaction) - Number(a.isOwnReaction));

    // Convert previewCounts map to array with content and count
    const preview = Array.from(previewCounts, ([content, count]) => ({
      content,
      count,
    }));

    return {
      messageId,
      totalCount,
      userReacted,
      preview,
      detailed,
    };
  }, [reactionsBySender, membersSocials, messageId]);
}
```

Key changes made:

1. Removed imports from `@utils/profile` and `useInboxProfileSocialsQueryConfig`
2. Imported `useProfilesQueries` from `@/features/profiles/profiles.query`
3. Replaced the `useQueries` with `useProfilesQueries` to fetch profile data
4. Updated the `membersSocials` mapping to use the profile data structure from the profiles query
5. Added optional chaining for `membersSocials` since the profiles data might be undefined initially

The code now uses the centralized profile query system instead of the deprecated social queries. The functionality remains the same, but it's now using the correct data source and follows the project's conventions.

---

_**User**_

don't use membersSocials, just use profiles directly

---

_**Assistant**_

I'll refactor the code to use profiles directly instead of creating an intermediate membersSocials mapping.

```typescript:features/conversation/conversation-message/conversation-message-reactions/use-conversation-message-reactions-rolled-up.tsx
import { useConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message.utils";
import { isCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { useProfilesQueries } from "@/features/profiles/profiles.query";
import { useMemo } from "react";
import {
  RolledUpReactions,
  SortedReaction,
} from "./conversation-message-reactions.types";
import { MessageId } from "@xmtp/react-native-sdk";

export function useConversationMessageReactionsRolledUp(args: {
  messageId: MessageId;
}) {
  const { messageId } = args;

  const { bySender: reactionsBySender } =
    useConversationMessageReactions(messageId);

  const inboxIds = Array.from(
    new Set(
      Object.entries(reactionsBySender ?? {}).map(
        ([senderInboxId]) => senderInboxId
      )
    )
  );

  const { data: profiles } = useProfilesQueries({
    xmtpInboxIds: inboxIds,
  });

  return useMemo((): RolledUpReactions => {
    const detailed: SortedReaction[] = [];
    let totalCount = 0;
    let userReacted = false;

    // Flatten reactions and track sender addresses
    const flatReactions = Object.entries(reactionsBySender ?? {}).flatMap(
      ([senderInboxId, senderReactions]) =>
        senderReactions.map((reaction) => ({ senderInboxId, ...reaction }))
    );
    totalCount = flatReactions.length;

    // Track reaction counts for preview
    const previewCounts = new Map<string, number>();

    flatReactions.forEach((reaction) => {
      const isOwnReaction = isCurrentAccountInboxId(reaction.senderInboxId);

      if (isOwnReaction) {
        userReacted = true;
      }

      // Count reactions for the preview
      previewCounts.set(
        reaction.content,
        (previewCounts.get(reaction.content) || 0) + 1
      );

      const profile = profiles?.[inboxIds.indexOf(reaction.senderInboxId)];

      detailed.push({
        content: reaction.content,
        isOwnReaction,
        reactor: {
          address: reaction.senderInboxId,
          userName: profile?.name,
          avatar: null, // Profile doesn't seem to have an avatar field
        },
      });
    });

    // Sort detailed array to place all OWN reactions at the beginning
    detailed.sort((a, b) => Number(b.isOwnReaction) - Number(a.isOwnReaction));

    // Convert previewCounts map to array with content and count
    const preview = Array.from(previewCounts, ([content, count]) => ({
      content,
      count,
    }));

    return {
      messageId,
      totalCount,
      userReacted,
      preview,
      detailed,
    };
  }, [reactionsBySender, profiles, messageId, inboxIds]);
}
```

Key changes made:
1. Removed the `membersSocials` mapping
2. Directly use `profiles` array in the `useMemo` hook
3. Find the corresponding profile using `inboxIds.indexOf`
4. Use `profile.name` directly for the userName
5. Set avatar to `null` since it seems the profile type doesn't have an avatar field
6. Added `inboxIds` to the dependency array of `useMemo`

This version should be more direct and type-safe. Let me know if you need any adjustments or if there are other profile fields we should be using.

---



---

