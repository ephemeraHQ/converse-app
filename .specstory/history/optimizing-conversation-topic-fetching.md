## SpecStory

## Optimizing Conversation Topic Fetching (1/13/2025, 11:15:19 AM)

_**User**_

use import { create, keyResolver, windowScheduler } from "@yornaath/batshit" to create a fetch to make sure to increase perf if we call this function with many different topics really fast. you can use getConversationTopicsData

---

_**Assistant**_

I'll help you implement batching for the conversation data fetching using `batshit`. The main changes will be in the `getConversationData` function and we'll need to add the batching configuration.

```typescript:queries/useConversationDataQuery.ts
import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { conversationDataQueryKey } from "@/queries/QueryKeys";
// ... existing imports ...

// ... existing types ...

const batchedGetConversationTopicData = create({
  // Batch multiple requests within a 50ms window
  scheduler: windowScheduler(50),
  // Create a unique key for each account+topic combination
  keyResolver: keyResolver((args: IArgs) => `${args.account}-${args.topic.topic}`),
  // The batch function that handles multiple requests
  async batchFn(args: IArgs[]) {
    const uniqueAccounts = [...new Set(args.map(arg => arg.account))];
    if (uniqueAccounts.length > 1) {
      // If different accounts, process individually
      return Promise.all(args.map(arg => getConversationTopicData(arg)));
    }
    // Batch fetch for same account
    const topics = args.map(arg => arg.topic);
    const results = await getConversationTopicsData({
      account: args[0].account,
      topics,
    });
    // Map results back to individual requests
    return args.map(arg => 
      results.find(r => r.topic === arg.topic.topic)!
    );
  }
});

async function getConversationData(args: IArgs) {
  return batchedGetConversationTopicData(args);
}

// ... rest of the file remains unchanged ...
```

This update adds batching capabilities to the conversation data fetching:

1. Created a batched version of `getConversationTopicData` using `batshit`
2. Uses a 50ms window to collect multiple requests
3. Batches requests only when they're for the same account
4. Uses `getConversationTopicsData` for batch fetching
5. Maintains the same interface for the rest of the file

The batching will automatically handle multiple rapid requests for different topics, improving performance by reducing the number of API calls.

---



---

