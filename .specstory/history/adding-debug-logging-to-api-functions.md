## SpecStory

## Adding Debug Logging to API Functions (1/13/2025, 8:39:16 PM)

_**User**_

at the beginningg of each function add something like logger.debug(`[API TOPICS] getTopic for ${}`)

---

_**Assistant**_

I'll help you add logging statements at the beginning of each function. I'll use template literals to include relevant parameters in the debug messages.

```typescript:utils/api/topics.ts
// Add import at the top
import { logger } from "@/utils/logger";

// ... existing schemas ...

export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;
  // ... rest of function ...
}

export async function getTopic(args: { account: string; topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] getTopic for account: ${args.account}, topic: ${args.topic}`);
  const { account, topic } = args;
  // ... rest of function ...
}

export async function markTopicAsRead(args: { account: string; topic: ConversationTopic; readUntil: number }) {
  logger.debug(`[API TOPICS] markTopicAsRead for account: ${args.account}, topic: ${args.topic}, readUntil: ${args.readUntil}`);
  const { account, topic, readUntil } = args;
  // ... rest of function ...
}

export async function markTopicAsUnread(args: { account: string; topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] markTopicAsUnread for account: ${args.account}, topic: ${args.topic}`);
  const { account, topic } = args;
  // ... rest of function ...
}

export async function pinTopic(args: { account: string; topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] pinTopic for account: ${args.account}, topic: ${args.topic}`);
  const { account, topic } = args;
  // ... rest of function ...
}

export async function unpinTopic(args: { account: string; topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] unpinTopic for account: ${args.account}, topic: ${args.topic}`);
  const { account, topic } = args;
  // ... rest of function ...
}

export async function restoreTopic(args: { account: string; topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] restoreTopic for account: ${args.account}, topic: ${args.topic}`);
  const { account, topic } = args;
  // ... rest of function ...
}

export async function deleteTopic(args: { account: string; topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] deleteTopic for account: ${args.account}, topic: ${args.topic}`);
  const { account, topic } = args;
  // ... rest of function ...
}
```

I've added:
1. An import for the logger at the top of the file
2. Debug log statements at the beginning of each function
3. Each log message follows the format `[API TOPICS] functionName` followed by relevant parameters
4. Used template literals to interpolate the values from the args object

The rest of each function remains unchanged. You'll just need to ensure that the `logger` utility is properly exported from "@/utils/logger".

---



---

