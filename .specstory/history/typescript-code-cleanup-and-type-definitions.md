## SpecStory

## TypeScript Code Cleanup and Type Definitions (2/18/2025, 11:03:27 AM)

_**User**_

clean using @typescript.mdc 

---

_**Assistant**_

I'll help clean up the code according to the TypeScript guidelines. The main issues to address are:

1. The undefined `IProfileSocialsZodSchema` type
2. Following the guidelines for types over interfaces
3. Improving function parameter typing
4. Using type assertions with satisfies where appropriate

Here are the suggested edits:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

type GroupMetadataChangeParams = {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
};

type GroupMemberChangeParams = {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
};

// Update function to use object params
function handleGroupMetadataChange({ initiatorName, content }: GroupMetadataChangeParams) {
  // ... existing code ...
}

function handleGroupMemberChange({ initiatorName, members, type }: GroupMemberChangeParams) {
  if (members.length === 0) return null;

  if (members.length === 1) {
    const memberSocials = getInboxProfileSocialsQueryData({
      inboxId: members[0].inboxId,
    });
    // Fix the type issue by using the correct type from your schema
    const memberName = getPreferredInboxAddress(memberSocials);

    if (!memberName) {
      return translate(`conversation_list.member_${type}_unknown`, {
        userName: initiatorName,
      });
    }

    // ... rest of the existing code ...
  }
  // ... rest of the existing code ...
}

type MessagePlainTextHook = (
  message: DecodedMessageWithCodecsType | undefined
) => string;

// Use function declaration for the hook
export function useMessagePlainText(
  message: DecodedMessageWithCodecsType | undefined
): string {
  const account = useCurrentAccount();

  useEffect(() => {
    // ... existing code ...
  }, [message, account]);

  return useMemo(() => {
    // ... existing code ...
  }, [message, account]);
}
```

The main changes made:

1. Added proper type definitions for function parameters using the `type` keyword instead of interfaces
2. Removed the problematic `IProfileSocialsZodSchema` type usage - you should use the correct type from your schema
3. Converted the hook to use a function declaration instead of an arrow function
4. Added explicit typing for the hook function
5. Used object parameters for complex function arguments

You'll need to ensure you have the correct type for the profile socials data from your schema. If you can share the schema definition, I can help with the correct type to use instead of `IProfileSocialsZodSchema`.

Let me know if you need any clarification or have the schema definition to help resolve the type error completely.

---



---

