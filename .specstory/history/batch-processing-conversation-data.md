## SpecStory

## Batch Processing Conversation Data (1/13/2025, 11:28:48 AM)

_**User**_

getConversationsData returns { [topic]: data , ...}

---

_**Assistant**_

Based on the information provided, I'll help modify the code to handle the object structure returned by `getConversationsData`. Here's how we should update the batching function:

```typescript:queries/useConversationDataQuery.ts
const batchedGetConversationTopicData = create({
  scheduler: windowScheduler(50),
  resolver: keyResolver((args: IArgs) => `${args.account}-${args.topic.topic}`),
  async batchFn(args: IArgs[]) {
    // Group by account using Object.groupBy (or reduce if not available)
    const accountGroups = args.reduce(
      (groups, arg) => {
        groups[arg.account] = groups[arg.account] || [];
        groups[arg.account].push(arg);
        return groups;
      },
      {} as Record<string, IArgs[]>
    );

    // Process each account group and maintain mapping to original requests
    const results = await Promise.all(
      Object.entries(accountGroups).map(async ([account, groupArgs]) => {
        const conversationsData = await getConversationsData({
          account,
        });

        // Map back to original requests while maintaining order
        // Since conversationsData is an object with topics as keys
        return groupArgs.map((arg) => conversationsData[arg.topic.topic]);
      })
    );

    // Flatten while preserving the mapping to original requests
    return results.flat();
  },
});
```

The main changes are:
1. Removed the `topicDataMap` creation since we don't need it anymore
2. Directly access the data using the topic as a key from the `conversationsData` object: `conversationsData[arg.topic.topic]`

This modification assumes that `getConversationsData` returns an object where each key is a topic string and the value is the corresponding conversation data.

---



---

