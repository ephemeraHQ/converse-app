## SpecStory

## Update Deprecated Profile Socials Queries (2/10/2025, 3:26:14 PM)

_**User**_

Can you look at my old code base and replace all the places where we use @useProfileSocials.ts @useProfilesSocials.ts @useProfileSocialsQuery.ts  and replace it with @useInboxProfileSocialsQuery.ts  because right now we're using inbox id and the other one is deprecated. 

---

_**Assistant**_

I'll help you migrate from the deprecated profile socials queries to the new inbox-based version. Let me explain the changes needed:

1. First, let's update the deprecated hooks to properly forward to the new version:

```typescript:hooks/useProfileSocials.ts
import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { useInboxIdForAddress } from "@/hooks/useInboxIdForAddress";

/**
 * @deprecated Use useInboxProfileSocialsQuery instead
 */
export function useProfileSocials(peerAddress: string) {
  const { data: inboxId } = useInboxIdForAddress({ address: peerAddress });
  
  return useInboxProfileSocialsQuery({
    inboxId,
    caller: "useProfileSocials",
  });
}
```

```typescript:hooks/useProfilesSocials.ts
import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { useInboxIdForAddress } from "@/hooks/useInboxIdForAddress";
import { useQueries } from "@tanstack/react-query";

/**
 * @deprecated Use useInboxProfileSocialsQuery instead
 */
export function useProfilesSocials(peerAddresses: string[]) {
  return useQueries({
    queries: peerAddresses.map((address) => {
      const { data: inboxId } = useInboxIdForAddress({ address });
      
      return useInboxProfileSocialsQuery({
        inboxId,
        caller: "useProfilesSocials",
      }).queryKey;
    }),
  });
}
```

2. The old `useProfileSocialsQuery.ts` file can be marked as deprecated with a comment at the top:

```typescript:queries/useProfileSocialsQuery.ts
/**
 * @deprecated This entire file is deprecated. Use useInboxProfileSocialsQuery instead.
 * The functionality has been migrated to use inbox IDs rather than addresses.
 */
// ... rest of the file remains unchanged
```

The main changes are:

1. We're using `useInboxIdForAddress` to convert addresses to inbox IDs
2. We're properly passing the caller parameter to help with debugging
3. The deprecated hooks now act as adapters to the new inbox-based system

For any components currently using these hooks directly, they should be updated to use `useInboxProfileSocialsQuery` directly with an inbox ID. Would you like me to help identify and update those components as well?

Note: This migration approach allows for a gradual transition while maintaining backward compatibility. Components can be updated one at a time to use the new inbox-based query directly.

---

_**User**_

but can you change the imports of all the files instead? 

---

_**Assistant**_

I'll help you find and update all the imports in the files that are using the deprecated hooks. From the maybe_relevant_files list, let me check each one and provide the necessary changes.

1. First, let's check `GroupScreenMembersTable.tsx`:

```typescript:containers/GroupScreenMembersTable.tsx
// If it has any of these imports:
- import { useProfileSocials } from "@/hooks/useProfileSocials";
- import { useProfilesSocials } from "@/hooks/useProfilesSocials";
- import { useProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
// Replace with:
+ import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
```

Could you share the contents of these files so I can provide the exact changes needed for each one?

1. `containers/GroupScreenMembersTable.tsx`
2. `features/conversation/conversation-message/conversation-message-content-types/conversation-message-chat-group-update.tsx`
3. `features/conversation/conversation-message/conversation-message-reactions/use-conversation-message-reactions-rolled-up.tsx`
4. `features/conversation/conversation-screen-header/conversation-screen-dm-header-title.tsx`
5. `features/conversation/conversation-message/conversation-message-sender-avatar.tsx`
6. `features/conversation/conversation-screen-header/conversation-screen-new-dm-header-title.tsx`
7. `features/conversation-list/conversation-list.screen-header.tsx`

Once you share those files, I can provide the exact import changes needed for each one.

---



---

