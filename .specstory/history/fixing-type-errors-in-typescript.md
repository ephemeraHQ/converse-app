## SpecStory

## Fixing Type Errors in TypeScript (2/18/2025, 10:51:41 AM)

_**User**_

clean

---

_**Assistant**_

Let's fix those type errors. The issue is that `getInboxProfileSocialsQueryData` is returning `unknown` type, but `getPreferredInboxAddress` expects `IProfileSocialsZodSchema[] | null | undefined`.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    }) as IProfileSocialsZodSchema[] | null | undefined;
    const memberName = getPreferredInboxAddress(memberSocials);
// ... existing code ...

// ... existing code ...
        const initiatorSocials = getInboxProfileSocialsQueryData({
          inboxId: content.initiatedByInboxId,
        }) as IProfileSocialsZodSchema[] | null | undefined;
        const initiatorName = getPreferredInboxAddress(initiatorSocials);
// ... existing code ...
```

You'll also need to add the import for the type:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { IProfileSocialsZodSchema } from "@/features/social-profiles/social-profiles.types";
// ... rest of imports
```

This adds type assertions to handle the unknown return type from `getInboxProfileSocialsQueryData`. A better long-term solution would be to properly type the return value of `getInboxProfileSocialsQueryData`, but this fix will resolve the immediate type errors.

---



---

