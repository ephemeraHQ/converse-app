## SpecStory

## Adding Topic Property to Response Items (1/13/2025, 11:33:30 AM)

_**User**_

each item needs to have topic in response so i can resolve with item.topic

---

_**Assistant**_

I'll help you modify the code to ensure each item in the response includes the topic property. Here's the updated version:

```typescript:queries/useConversationDataQuery.ts
const batchedGetConversationTopicData = create({
  scheduler: windowScheduler(50),
  resolver: (items, query) => {
    return items.find(
      (item) => `${query.account}-${query.topic}` === item.topic
    );
  },
  fetcher: async (args: IArgs[]) => {
    const accountGroups = args.reduce(
      (groups, arg) => {
        groups[arg.account] = groups[arg.account] || [];
        groups[arg.account].push(arg);
        return groups;
      },
      {} as Record<string, IArgs[]>
    );

    const results = await Promise.all(
      Object.entries(accountGroups).map(async ([account, groupArgs]) => {
        const conversationsData = await getConversationsData({
          account,
        });

        // Include topic in each item for resolver matching
        return groupArgs.map((arg) => ({
          ...conversationsData[arg.topic],
          topic: `${account}-${arg.topic}`,
        }));
      })
    );

    return results.flat();
  },
});
```

The key change is in the mapping of the response data. Now we're explicitly adding the `topic` property to each item in the format that matches what the resolver is looking for (`${account}-${topic}`). This ensures the resolver can correctly match items using the `item.topic` property.

The change is in this part:
```typescript
return groupArgs.map((arg) => ({
  ...conversationsData[arg.topic],
  topic: `${account}-${arg.topic}`,
}));
```

Instead of just returning the conversation data directly, we spread the existing data and add the properly formatted topic identifier.

---



---

