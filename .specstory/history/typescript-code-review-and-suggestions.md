## SpecStory

## TypeScript Code Review and Suggestions (12/11/2024, 5:50:39 PM)

_**User**_

anything wrong you see here?

---

_**Assistant**_

After reviewing the code, here are a few suggestions for improvements based on your coding preferences:

1. In `conversation.store-context.tsx`, the types should be renamed to start with "I":

```typescript:features/conversation/conversation.store-context.tsx
// ... existing code ...
type IConversationStoreProps = {
  topic: ConversationTopic;
  conversationId: ConversationId;
};

// Rename these types
type IConversationStoreState = IConversationStoreProps & {};
type IConversationStoreProviderProps = React.PropsWithChildren<IConversationStoreProps>;
// ... existing code ...
```

2. The `QueryKeys.ts` file is using an enum, which goes against your preference. Here's how we could refactor it to use a const map:

```typescript:queries/QueryKeys.ts
export const QueryKeys = {
  // Conversations
  CONVERSATIONS: "conversations",
  CONVERSATION: "conversation",
  // ... rest of the keys
} as const;

type IQueryKeys = typeof QueryKeys;
```

3. The function name `useConversationCurrentConversationId` has a redundant "Conversation" in it. It should be renamed to:

```typescript:features/conversation/conversation.store-context.tsx
// ... existing code ...
export function useCurrentConversationId() {
  return useConversationStoreContext((state) => state.conversationId);
}
```

4. The `DEFAULT_PROPS` initialization with `null as unknown as ConversationTopic` is a bit hacky. Consider using optional properties or providing actual default values:

```typescript:features/conversation/conversation.store-context.tsx
const createConversationStore = (initProps: IConversationStoreProps) => {
  const DEFAULT_PROPS: Partial<IConversationStoreProps> = {};
  return createStore<IConversationStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }));
};
```

These changes would make the code more aligned with your preferred style and TypeScript best practices.

---

_**User**_

For the code present, we get this error:
```
Type '(conversation: Conversation<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>, params: ISendMessageParams) => Promise<...>' is not assignable to type 'MutationFunction<MessageId, Conversation<(TextCodec | ReactionCodec | ReadReceiptCodec | GroupUpdatedCodec | ReplyCodec | RemoteAttachmentCodec | StaticAttachmentCodec | TransactionReferenceCodec | CoinbaseMessagingPaymentCodec)[]>>'.
  Target signature provides too few arguments. Expected 2 or more, but got 1.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error indicates that the `sendMessage` function expects more than one argument, but the `mutationFn` is only providing one. To resolve this, you need to ensure that the `mutationFn` is called with the correct number of arguments.

Here's how you can fix it:

```typescript:features/conversation/conversation-new-dm.tsx
  const { mutateAsync: sendMessageAsync } = useMutation({
    mutationFn: async ({ conversation, params }: { conversation: ConversationType, params: ISendMessageParams }) => {
      return sendMessage(conversation, params);
    },
    // TODO: Add this for optimistic update and faster UX
    // onMutate: (args) => {
```

### Explanation:
- The `mutationFn` is now an async function that destructures its argument to get both `conversation` and `params`.
- It then calls `sendMessage` with both arguments, matching the expected signature. 

Make sure that `ConversationType` is correctly defined to match the expected type of the `conversation` argument.

---

_**User**_

For the code present, we get this error:
```
Type '{ text: string | undefined; remoteAttachment: RemoteAttachmentContent | undefined; }' is not assignable to type '{ text: string; remoteAttachment?: RemoteAttachmentContent | undefined; } | { text?: string | undefined; remoteAttachment: RemoteAttachmentContent; }'.
  Type '{ text: string | undefined; remoteAttachment: RemoteAttachmentContent | undefined; }' is not assignable to type '{ text?: string | undefined; remoteAttachment: RemoteAttachmentContent; }'.
    Types of property 'remoteAttachment' are incompatible.
      Type 'RemoteAttachmentContent | undefined' is not assignable to type 'RemoteAttachmentContent'.
        Type 'undefined' is not assignable to type 'RemoteAttachmentContent'.
          Type 'undefined' is not assignable to type 'RemoteAttachmentMetadata'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



The error suggests we need at least one of `text` or `remoteAttachment` to be non-optional. Here's the fix:

```typescript:features/conversation/conversation-new-dm.tsx
          params: {
            content: remoteAttachment 
              ? { remoteAttachment }
              : { text: text || "👋" },
            referencedMessageId,
          },
```

This ensures we always have either a valid `text` or `remoteAttachment`, but not both as undefined.

---



---

