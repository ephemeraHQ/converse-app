## SpecStory

## Error Handling in addConversationMessage (12/17/2024, 3:59:14 PM)

_**User**_

addConversationMessage isn'T an async function, if there's a crash in there, will it be catched in the captureError?

---

_**Assistant**_

No, if `addConversationMessage` isn't an async function and throws a synchronous error, the `try/catch` block will still catch the error. Try/catch blocks work for both synchronous and asynchronous code.

However, following your code style preferences, I would suggest making the following change to make it more explicit and consistent with the rest of your codebase:

```typescript:utils/xmtpRN/messages.ts
// ... existing code ...
    if (isMessageFromOtherUser || isNonTextMessage) {
      try {
        await addConversationMessage({
          account: client.address,
          topic: message.topic as ConversationTopic,
          message,
        });
      } catch (error) {
        captureError(error);
      }
    }
// ... existing code ...
```

I added the `await` keyword before `addConversationMessage` to make it explicit that we're handling asynchronous operations. If `addConversationMessage` is truly synchronous, you can leave it as is, but it would be unusual for a function that interacts with messages/conversations to be synchronous in a React Native app.

---

_**User**_

here's addConversationMessage:

export const addConversationMessage = (args: {
  account: string;
  topic: ConversationTopic;
  message: DecodedMessageWithCodecsType;
}) => {
  const { account, topic, message } = args;

  queryClient.setQueryData<ConversationMessagesQueryData>(
    conversationMessagesQueryKey(account, topic),
    (previousMessages) => {
      const processedMessages = processMessages({
        messages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      });
      return processedMessages;
    }
  );
};

---

_**Assistant**_

I see - in this case, `addConversationMessage` is indeed synchronous since it's just using `queryClient.setQueryData()` to update the React Query cache. The `try/catch` block in `streamAllMessages` will still catch any synchronous errors that might occur during:

1. The execution of `addConversationMessage`
2. The message processing in `processMessages`
3. Any cache updates in `queryClient.setQueryData`

So the error handling is working correctly as is. No need to add `await` since there's no Promise being returned. The current implementation is appropriate:

```typescript:utils/xmtpRN/messages.ts
if (isMessageFromOtherUser || isNonTextMessage) {
  try {
    addConversationMessage({
      account: client.address,
      topic: message.topic as ConversationTopic,
      message,
    });
  } catch (error) {
    captureError(error);
  }
}
```

---

_**User**_

For the code present, we get this error:
```
Type '{ client: Client<SupportedCodecsType>; id: ConversationId; createdAt: number; version: ConversationVersion.GROUP; topic: ConversationTopic; ... 48 more ...; members?: (() => Promise<...>) | undefined; }' is not assignable to type 'GroupWithCodecsType'.
  Types of property 'memberInboxIds' are incompatible.
    Type '(() => Promise<string[]>) | undefined' is not assignable to type '() => Promise<string[]>'.
      Type 'undefined' is not assignable to type '() => Promise<string[]>'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `Partial<GroupWithCodecsType>` might make required functions optional. Here's the fix:

```typescript:queries/useGroupQuery.ts
export function updateGroupQueryData(
  account: string,
  topic: ConversationTopic,
  group: Omit<Partial<GroupWithCodecsType>, 'memberInboxIds'> & Pick<GroupWithCodecsType, 'memberInboxIds'>
) {
  const previousGroupData = getGroupQueryData({ account, topic });
  if (!previousGroupData) {
    return;
  }
  setGroupQueryData({
    account,
    topic,
    group: {
      ...previousGroupData,
      ...group,
    },
  });
}
```

This ensures `memberInboxIds` remains required while other properties stay optional.

---



---

