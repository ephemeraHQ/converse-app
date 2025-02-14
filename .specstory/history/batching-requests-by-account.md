## SpecStory

## Batching Requests by Account (1/13/2025, 11:23:05 AM)

_**User**_

fix so that we should always just have a batch per account. So if we call the function with different account then we just don't batch them goeterh

---

_**Assistant**_

I'll help modify the code to handle batching per account separately. Here's the updated version focusing on the relevant changes:

```typescript:queries/useConversationDataQuery.ts
const batchedGetConversationTopicData = create({
  // Batch multiple requests within a 50ms window
  scheduler: windowScheduler(50),
  // Create unique key for each account to batch by account
  resolver: keyResolver((args: IArgs) => args.account),
  // The batch function that handles multiple requests
  async batchFn(args: IArgs[]) {
    // Group requests by account
    const accountGroups = args.reduce((groups, arg) => {
      const account = arg.account;
      groups[account] = groups[account] || [];
      groups[account].push(arg);
      return groups;
    }, {} as Record<string, IArgs[]>);

    // Process each account group separately
    const results = await Promise.all(
      Object.entries(accountGroups).map(async ([account, accountArgs]) => {
        const topics = accountArgs.map((arg) => arg.topic);
        return getConversationData({
          account,
          topics,
        });
      })
    );

    // Flatten results and map back to original requests
    const flatResults = results.flat();
    return args.map((arg) => 
      flatResults.find((r) => r.topic === arg.topic.topic)!
    );
  },
});
```

Key changes made:
1. Modified the resolver to only use `account` as the key, which will batch requests per account
2. Removed the `uniqueAccounts` check since we now handle different accounts naturally through grouping
3. Added logic to group requests by account and process each group separately
4. Flattened the results and mapped them back to the original requests

This approach will:
- Automatically batch requests for the same account within the 50ms window
- Handle different accounts in parallel without trying to combine them
- Maintain the same return structure expected by the rest of the code

---



---

