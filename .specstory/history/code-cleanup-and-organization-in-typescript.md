## SpecStory

## Code Cleanup and Organization in TypeScript (2/18/2025, 11:07:44 AM)

_**User**_

clean this file following my cursor rules

---

_**Assistant**_

I'll help clean up the file according to the style guide. The main issue is the missing type `IProfileSocialsZodSchema`. Let me help organize and improve the code.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing imports ...
import { IProfileSocialsZodSchema } from "@/features/profile/profile.types"; // Add this import

// Move helper functions outside of the main hook file
function handleGroupMetadataChange({
  initiatorName,
  content,
}: {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}) {
  // ... existing code ...
}

function handleGroupMemberChange({
  initiatorName,
  members,
  type,
}: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}) {
  if (members.length === 0) return null;

  if (members.length === 1) {
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    });
    
    // Fixed type assertion
    const memberName = getPreferredInboxAddress(
      memberSocials as IProfileSocialsZodSchema[] | null | undefined
    );

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

// ... rest of the existing code ...
```

The main changes are:

1. Added import for `IProfileSocialsZodSchema` type which was missing
2. Moved helper functions outside of the main hook file for better organization
3. Fixed type assertion for `memberSocials` using the proper imported type

The rest of the code follows the style guide well, with:
- Proper error handling
- Good use of early returns
- Clear function and variable naming
- Appropriate use of TypeScript types
- Good separation of concerns

No other major changes are needed as the code already follows most of the style guide principles.

---



---

