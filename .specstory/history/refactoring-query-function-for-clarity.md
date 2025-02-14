## SpecStory

## Refactoring Query Function for Clarity (12/9/2024, 3:04:15 PM)

_**User**_

extract queryFn

---

_**Assistant**_

I'll help you extract the queryFn into a separate function to improve code organization. Here's how to modify the file:

```typescript:queries/useConversationWithPeerQuery.ts
// ... existing imports ...

async function fetchConversationWithPeer(args: { account: string; peer: string }) {
  const { account, peer } = args;
  
  logger.info("[Crash Debug] queryFn fetching conversation with peer");
  if (!peer) {
    return null;
  }
  
  const conversation = await getConversationByPeerByAccount({
    account,
    peer,
    includeSync: true,
  });

  if (!conversation) {
    return null;
  }

  setConversationQueryData(account, conversation.topic, conversation);
  return conversation;
}

export const useConversationWithPeerQuery = (
  account: string,
  peer: string,
  options?: Partial<UseQueryOptions<ConversationWithCodecsType | null>>
) => {
  return useQuery({
    ...options,
    queryKey: conversationWithPeerQueryKey(account, peer!),
    queryFn: () => fetchConversationWithPeer({ account, peer }),
    enabled: !!peer,
  });
};

// ... rest of the file ...
```

The main changes are:
1. Extracted the queryFn logic into a separate `fetchConversationWithPeer` function
2. Following the preferred pattern of using an object parameter for the function arguments
3. Updated the queryFn to call the new function with the required parameters
4. The rest of the file remains unchanged

This makes the code more maintainable and easier to test if needed.

---

_**User**_

For the code present, we get this error:
```
Argument of type 'ConversationWithCodecsType' is not assignable to parameter of type 'Updater<Dm<SupportedCodecsType> | undefined, Dm<SupportedCodecsType> | undefined>'.
  Type 'Group<SupportedCodecsType>' is not assignable to type 'Updater<Dm<SupportedCodecsType> | undefined, Dm<SupportedCodecsType> | undefined>'.
    Property 'peerInboxId' is missing in type 'Group<SupportedCodecsType>' but required in type 'Dm<SupportedCodecsType>'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error suggests we need to handle both DM and Group conversation types. Here's the fix:

```typescript:queries/useConversationWithPeerQuery.ts
export function updateConversationWithPeerQueryData(
  account: string,
  peer: string,
  conversation: ConversationWithCodecsType
) {
  queryClient.setQueryData<ConversationWithPeerQueryData>(
    conversationWithPeerQueryKey(account, peer),
    () => conversation
  );
}
```

The key change is wrapping `conversation` in an updater function `() => conversation`. This tells TypeScript we're intentionally handling the type conversion, resolving the type mismatch between DM and Group conversations.

---



---

