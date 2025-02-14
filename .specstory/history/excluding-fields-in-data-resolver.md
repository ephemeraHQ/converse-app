## SpecStory

## Excluding Fields in Data Resolver (1/13/2025, 3:00:47 PM)

_**User**_

here's the problem I have, I don't wnat to return account and topic in the resutsl... but I need them in the resolver! What can i dop

---

_**Assistant**_

Ah, I understand the issue. You need the `account` and `topic` for matching in the resolver, but don't want them in the final result. We can modify the resolver to strip these fields before returning the match. Here's how to update the code:

```typescript:queries/use-conversation-data-query.ts
const batchedGetConversationTopicData = create({
  scheduler: windowScheduler(50),
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        `${query.account}-${query.topic}` === `${item.account}-${item.topic}`
    );
    if (!match) return undefined;
    
    // Destructure to remove account and topic from the result
    const { account, topic, ...rest } = match;
    return rest;
  },
  // ... rest of the code stays the same ...
});
```

The change is simple - we still use `account` and `topic` for matching in the resolver, but before returning the match, we destructure it to remove these fields. This way, the downstream consumers of the data will only receive the conversation data without the matching fields we needed internally.

---



---

