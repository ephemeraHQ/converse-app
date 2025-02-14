## SpecStory

## Managing Reactions: Add and Remove Logic (12/5/2024, 1:45:04 PM)

_**User**_

with reactions it's missing something, each reactoon can be action "removed" or "added" if a reaction is action "added" we add it to the list, but if later we see a "removed" one for the same messageId then we remove ti from the list, etc...

---

_**Assistant**_

To handle the addition and removal of reactions, you can modify the loop to check the `action` property of each `reactionContent`. If the action is "added", you add the reaction to the list. If the action is "removed", you remove it from the list. Here's how you can update the code:

```typescript:queries/useConversationMessages.ts
for (const message of messages) {
  ids.push(message.id as MessageId);
  byId[message.id as MessageId] = message;

  if (!message.contentTypeId.includes("reaction:")) {
    continue;
  }

  const reactionContent = message.content() as ReactionContent;
  const referenceMessageId = reactionContent?.reference as MessageId;

  if (!reactionContent || !referenceMessageId) {
    continue;
  }

  if (!reactions[referenceMessageId]) {
    reactions[referenceMessageId] = {
      bySender: {},
      byReactionContent: {},
    };
  }

  const messageReactions = reactions[referenceMessageId];
  const senderAddress = message.senderAddress as InboxId;

  if (reactionContent.action === "added") {
    messageReactions.byReactionContent[reactionContent.content] = [
      ...(messageReactions.byReactionContent[reactionContent.content] || []),
      senderAddress,
    ];

    messageReactions.bySender[senderAddress] = [
      ...(messageReactions.bySender[senderAddress] || []),
      reactionContent,
    ];
  } else if (reactionContent.action === "removed") {
    messageReactions.byReactionContent[reactionContent.content] = (
      messageReactions.byReactionContent[reactionContent.content] || []
    ).filter((id) => id !== senderAddress);

    messageReactions.bySender[senderAddress] = (
      messageReactions.bySender[senderAddress] || []
    ).filter((reaction) => reaction.content !== reactionContent.content);
  }
}

return {
  ids,
  byId,
  reactions,
};
```

### Explanation:
- **Added Reactions**: If the action is "added", the reaction is appended to the respective lists.
- **Removed Reactions**: If the action is "removed", the reaction is filtered out from the lists using the `filter` method. This ensures that only the reactions that are not removed remain in the list.

---



---

