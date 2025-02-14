## SpecStory

## TypeScript Type Mismatch Fixes (2/18/2025, 10:50:57 AM)

_**User**_

clean

---

_**Assistant**_

The linter errors indicate type mismatches when calling `getPreferredInboxAddress()`. Let's fix the type issues:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
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
    // Add type assertion since we know the query returns IProfileSocialsZodSchema[]
    const memberName = getPreferredInboxAddress(memberSocials as IProfileSocialsZodSchema[]);

    // ... rest of the function
  }
  // ... existing code ...
};

// ... existing code ...

if (isGroupUpdatedMessage(message)) {
  const content = message.content();
  const initiatorSocials = getInboxProfileSocialsQueryData({
    inboxId: content.initiatedByInboxId,
  });
  // Add type assertion here as well
  const initiatorName = getPreferredInboxAddress(initiatorSocials as IProfileSocialsZodSchema[]);

  // ... rest of the code ...
}

// ... existing code ...
```

You'll also need to add this import at the top:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { IProfileSocialsZodSchema } from "@/types";
```

The issue was that `getInboxProfileSocialsQueryData()` returns `unknown`, but `getPreferredInboxAddress()` expects `IProfileSocialsZodSchema[] | null | undefined`. We fix this by adding type assertions since we know the actual type of the data.

---



---

