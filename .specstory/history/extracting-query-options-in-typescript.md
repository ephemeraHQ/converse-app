## SpecStory

## Extracting Query Options in TypeScript (2/3/2025, 4:02:13 PM)

_**User**_

extract query options

---

_**Assistant**_

I'll help extract the query options into a separate function following the style guide. Here's how we can modify the file:

```typescript:queries/use-dm-peer-inbox-id-query.ts
// ... existing code ...

function getDmPeerInboxIdQueryOptions({ account, topic, caller }: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) {
  return {
    queryKey: dmPeerInboxIdQueryKey(account, topic),
    queryFn: async function getPeerInboxId() {
      const conversation = await getOrFetchConversation({
        account,
        topic,
        caller: "getPeerInboxId",
      });

      if (!conversation) {
        throw new Error(`Conversation not found with caller ${caller}`);
      }

      if (!isConversationDm(conversation)) {
        throw new Error(`Conversation is not a DM with caller ${caller}`);
      }

      logger.debug(
        `[getPeerInboxId] getting peer inbox id for ${topic}, account: ${account} and caller ${caller}`
      );

      return conversation.peerInboxId();
    },
    enabled: !!account && !!topic,
    persister: reactQueryPersister,
  };
}

export const useDmPeerInboxIdQuery = (args: {
  account: string;
  topic: ConversationTopic;
  caller: string;
}) => {
  const { account, topic, caller } = args;
  return useQuery(getDmPeerInboxIdQueryOptions({ account, topic, caller }));
};
```

The changes:
1. Extracted the query options into a separate function `getDmPeerInboxIdQueryOptions`
2. The function takes an object parameter following the style guide
3. The hook now uses the extracted options function
4. Maintained all existing functionality and error handling

This follows the React Query principles from the style guide by using object parameters for query options and keeping the code clean and maintainable.

---



---

