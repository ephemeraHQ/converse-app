## SpecStory

## Code Refactoring and Optimization Discussion (2/18/2025, 10:55:37 AM)

_**User**_

clean

---

_**Assistant**_

Looking at the code, here are the suggested improvements:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

// Move type definition to a separate interface for better readability
interface GroupMetadataChangeProps {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}

interface GroupMemberChangeProps {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
}

const handleGroupMetadataChange = ({
  initiatorName,
  content,
}: GroupMetadataChangeProps) => {
  // ... existing code ...
};

const handleGroupMemberChange = ({
  initiatorName,
  members,
  type,
}: GroupMemberChangeProps) => {
  // ... existing code ...
};

export const useMessagePlainText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  const account = useCurrentAccount();

  useEffect(() => {
    if (!message || !isGroupUpdatedMessage(message)) return;

    const content = message.content();
    const inboxIds = Array.from(
      new Set([
        content.initiatedByInboxId,
        ...content.membersAdded.map((m) => m.inboxId),
        ...content.membersRemoved.map((m) => m.inboxId),
      ])
    );

    Promise.all(
      inboxIds.map((inboxId) =>
        fetchInboxProfileSocialsQuery({
          inboxId,
          caller: "useMessagePlainText",
        }).catch(captureError)
      )
    );
  }, [message, account]);

  return useMemo(() => {
    if (!account || !message) return "";

    try {
      if (isReplyMessage(message)) {
        const content = (message as DecodedMessage<ReplyCodec>).content();
        return typeof content === "string" ? content : content.content.text;
      }

      // ... rest of the existing code ...
    } catch (e) {
      logger.error("Error getting message text", {
        error: e,
        contentTypeId: message.contentTypeId,
      });
      return message.fallback;
    }
  }, [message, account]);
};
```

Changes made:
1. Added explicit interfaces for function parameters
2. Removed duplicate inboxIds using Set
3. Used Promise.all for parallel fetching of profile socials
4. Removed unnecessary type casting in error logging
5. Improved error boundary handling

These changes make the code more maintainable and type-safe while improving performance with parallel fetching.

---

_**User**_

fix typescript by looking at my typescript guidelines

---

_**Assistant**_

Looking at the code, here are the improvements to follow TypeScript guidelines:

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing code ...

type GroupMetadataChangeProps = Readonly<{
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
}>;

type GroupMemberChangeProps = Readonly<{
  initiatorName: string;
  members: ReadonlyArray<{ inboxId: InboxId }>;
  type: "added" | "removed";
}>;

// ... rest of existing code ...

export const useMessagePlainText = (
  message: DecodedMessageWithCodecsType | undefined
): string => {
  // ... rest of existing code ...
};
```

Changes made:
1. Changed `interface` to `type` with `Readonly`
2. Used `ReadonlyArray` for the members array
3. Added explicit return type for the hook
4. Made props readonly to prevent accidental mutations

These changes align with TypeScript best practices by making the types more strict and explicit.

---



---

