## SpecStory

## Fixing TypeScript Linter Error (2/18/2025, 11:07:14 AM)

_**User**_

clean following my rules

---

_**Assistant**_

I'll help fix the linter error by properly importing and using the correct type. The error occurs because `IProfileSocialsZodSchema` is not imported or defined. Let's fix this by importing it from the correct location.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...
import { IProfileSocialsZodSchema } from "@/features/profile/profile.types";

// ... existing code ...

const handleGroupMemberChange = ({
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
    const memberName = getPreferredInboxAddress(
      memberSocials as IProfileSocialsZodSchema[] | null | undefined
    );

    // ... existing code ...
  }
  // ... existing code ...
};

// ... rest of the file remains unchanged ...
```

I've added the import for `IProfileSocialsZodSchema` from the profile types file. This should resolve the linter error while maintaining the existing functionality. The type assertion is still needed here since `getInboxProfileSocialsQueryData` might return a different type than what `getPreferredInboxAddress` expects.

---



---

