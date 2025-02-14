## SpecStory

## TypeScript Code Cleanup and Improvements (2/18/2025, 11:24:34 AM)

_**User**_

clean

---

_**Assistant**_

I'll help clean up the code according to the provided guidelines. The main issue is the undefined `IProfileSocialsZodSchema` type. Here are the necessary changes:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

// Import the missing type
import { IProfileSocialsZodSchema } from "@/features/profile/profile.types";

// ... existing code ...

// Improve type safety and readability for the handleGroupMemberChange function
function handleGroupMemberChange(args: {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}) {
  const { initiatorName, members, type } = args;
  
  if (members.length === 0) return null;

  if (members.length === 1) {
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    });

    // Remove type assertion since we now have the proper import
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
}

// ... rest of existing code ...
```

The main changes are:

1. Added import for `IProfileSocialsZodSchema` type
2. Converted `handleGroupMemberChange` to use the `function` keyword and proper object parameter typing
3. Removed unnecessary type assertion since we now have the proper type import
4. Added destructuring at the top of the `handleGroupMemberChange` function

The rest of the code follows the guidelines well, with:
- Proper error handling
- Good use of early returns
- Clear and descriptive variable names
- Functional programming patterns
- Proper use of logger
- Good separation of concerns

No other changes are needed as the code is already well-structured and follows most of the best practices.

---



---

