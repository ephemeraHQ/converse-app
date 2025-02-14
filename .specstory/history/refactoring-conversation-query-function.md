## SpecStory

## Refactoring Conversation Query Function (1/20/2025, 8:55:10 PM)

_**User**_

instead of getting conversation in the queryFn useConversationQuery and pass it in props

---

_**Assistant**_

I'll help modify the code to accept the conversation as a prop instead of fetching it inside the queryFn. Here's how we can update it:

```typescript:queries/useDmPeerInbox.ts
// ... existing code ...

const getDmPeerInboxIdQueryOptions = (args: {
  account: string;
  topic: ConversationTopic;
  conversation: ReturnType<typeof getConversationQueryData>;
}) => {
  const { account, topic, conversation } = args;
  return queryOptions({
    queryKey: dmPeerInboxIdQueryKey(account, topic),
    queryFn: () => {
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (!isConversationDm(conversation)) {
        throw new Error("Conversation is not a DM");
      }
      return conversation.peerInboxId();
    },
    enabled: !!account && !!topic && !!conversation,
  });
};

export const useDmPeerInboxId = (args: {
  account: string;
  topic: ConversationTopic;
  conversation: ReturnType<typeof getConversationQueryData>;
}) => {
  const { account, topic, conversation } = args;
  
  return useQuery(getDmPeerInboxIdQueryOptions({ account, topic, conversation }));
};
```

Key changes made:
1. Added `conversation` parameter to both `getDmPeerInboxIdQueryOptions` and `useDmPeerInboxId`
2. Removed the `getConversationQueryData` call from within `queryFn`
3. Added `!!conversation` to the `enabled` condition
4. Used TypeScript's `ReturnType` utility to infer the conversation type from `getConversationQueryData`

---



---

