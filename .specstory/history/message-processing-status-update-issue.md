## SpecStory

## Message Processing Status Update Issue (2/7/2025, 11:26:16 AM)

_**User**_

I've put some logs to see the processed messages and stuff and here what i got :

 previousMessages 1: {"byId": {"3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0": {"contentTypeId": "xmtp.org/text:1.0", "deliveryStatus": "UNPUBLISHED", "fallback": undefined, "id": "3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0", "nativeContent": [Object], "senderInboxId": "8103fc5fbf29e514bcc6b50062e0fc16e0cbfd64e6264a84b9075da3b9df4da3", "sentNs": 1738945498753022000, "topic": "/xmtp/mls/1/g-93b6dc61bb3a8e66d5ed3068cbed2abd/proto"}}, "ids": ["3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0"], "reactions": {}}
 LOG  message 1: {"contentTypeId": "xmtp.org/text:1.0", "deliveryStatus": "PUBLISHED", "fallback": undefined, "id": "3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0", "nativeContent": {"text": "Hey"}, "senderInboxId": "8103fc5fbf29e514bcc6b50062e0fc16e0cbfd64e6264a84b9075da3b9df4da3", "sentNs": 1738945498881168000, "topic": "/xmtp/mls/1/g-93b6dc61bb3a8e66d5ed3068cbed2abd/proto"}
 LOG  processedMessages 1: {"byId": {"3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0": {"contentTypeId": "xmtp.org/text:1.0", "deliveryStatus": "UNPUBLISHED", "fallback": undefined, "id": "3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0", "nativeContent": [Object], "senderInboxId": "8103fc5fbf29e514bcc6b50062e0fc16e0cbfd64e6264a84b9075da3b9df4da3", "sentNs": 1738945498753022000, "topic": "/xmtp/mls/1/g-93b6dc61bb3a8e66d5ed3068cbed2abd/proto"}}, "ids": ["3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0", "3c8cb08beca9ceee88d2aaf8ead05ab3142a93c2d12eb690e332f8578bc6a5b0"], "reactions": {}}

The problem i see is that the message (the new one we want to add) have "PUBLISHED" has a deliveryStatus value but when we processMessages it doens'T update the message!  so in console.log("processedMessages 1:", processedMessages); we see that the message still has deliverystatus to "UNPUBLISHED" which is false!

---

_**Assistant**_

I see the issue. In the `processMessages` function, when handling new messages with the same ID as existing ones, it's not updating the existing message with the new data. Let's modify the `processMessages` function to properly update messages when they have the same ID.

```typescript:queries/conversation-messages-query.ts
// ... existing code ...

function processMessages(args: {
  newMessages: DecodedMessageWithCodecsType[];
  existingData?: IMessageAccumulator;
  prependNewMessages?: boolean;
}): IMessageAccumulator {
  const { newMessages, existingData, prependNewMessages = false } = args;

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      };

  // For now, we ignore messages with these content types
  const validMessages = newMessages.filter(
    (message) =>
      !ignoredContentTypesPrefixes.some((prefix) =>
        message.contentTypeId.startsWith(prefix)
      )
  );

  // First process regular messages
  for (const message of validMessages) {
    // We handle reactions after
    if (!isReactionMessage(message)) {
      const messageId = message.id as MessageId;

      // If message already exists, update it with new data
      if (result.byId[messageId]) {
        result.byId[messageId] = message;
        continue; // Skip adding to ids since it already exists
      }

      if (prependNewMessages) {
        result.byId = { [messageId]: message, ...result.byId };
        result.ids = [messageId, ...result.ids];
      } else {
        result.byId[messageId] = message;
        result.ids.push(messageId);
      }
    }
  }

  // ... rest of the existing code for handling reactions ...
```

The key changes are:
1. We now check if a message with the same ID already exists in `result.byId`
2. If it exists, we update it with the new message data
3. We skip adding to the `ids` array since it's already there
4. If it's a new message, we proceed with the existing logic for adding new messages

This should ensure that when a message with "PUBLISHED" status comes in to replace an "UNPUBLISHED" message with the same ID, the update happens correctly.

---



---

