## SpecStory

## TypeScript Type Fixes for Group Member Handling (2/18/2025, 10:49:58 AM)

_**User**_

clean this file by checking my rules

---

_**Assistant**_

The linter errors indicate type issues with `getPreferredInboxAddress()` arguments. Let's fix the typing:

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

    if (!memberName) {
      return translate(`conversation_list.member_${type}_unknown`, {
        userName: initiatorName,
      });
    }
    // ... existing code ...
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
  // ... existing code ...
}

// ... existing code ...
```

You'll also need to add this import at the top:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { IProfileSocialsZodSchema } from "@/types";
```

The issue was that `getInboxProfileSocialsQueryData()` returns `unknown`, but `getPreferredInboxAddress()` expects `IProfileSocialsZodSchema[] | null | undefined`. We fix this by adding type assertions since we know the actual shape of the data.

---



---

