## SpecStory

## Prevent Duplicate Reactions Validation (12/11/2024, 3:19:09 PM)

_**User**_

I need t oadd another validation. If there's already a reaction for the same sender, referenceMessage and content, it means we already processed it, we don't want to add another one...

---

_**Assistant**_

I'll help you add a validation to check for existing reactions before adding new ones. We'll modify the "added" action case to check if the reaction already exists.

```typescript:queries/useConversationMessages.ts
    const messageReactions = result.reactions[referenceMessageId];

    if (reactionContent.action === "added") {
      // Check if this sender already has this reaction for this message
      const hasExistingReaction = messageReactions.bySender[senderAddress]?.some(
        (reaction) => reaction.content === reactionContent.content
      );

      if (!hasExistingReaction) {
        messageReactions.byReactionContent[reactionContent.content] = [
          ...(messageReactions.byReactionContent[reactionContent.content] || []),
          senderAddress,
        ];
        messageReactions.bySender[senderAddress] = [
          ...(messageReactions.bySender[senderAddress] || []),
          reactionContent,
        ];
      }
    } else if (reactionContent.action === "removed") {
      // ... existing remove logic ...
```

This change adds a `hasExistingReaction` check that looks through the sender's existing reactions to see if they already have a reaction with the same content. The reaction is only added if no existing reaction is found. The removal logic can stay the same since removing a non-existent reaction is harmless.

---



---

