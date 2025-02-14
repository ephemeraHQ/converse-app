## SpecStory

## Implementing Safe Parsing and Error Logging (1/14/2025, 9:49:54 AM)

_**User**_

ok for each function add a safeParse and if error log the error but still return the data

---

_**Assistant**_

I'll help you add safeParse to each function while maintaining error logging. Here are the necessary changes:

```typescript:utils/api/topics.ts
// ... existing imports and schemas ...

export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  const parseResult = z.record(TopicSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] getTopics parse error:', parseResult.error);
  }
  return data;
}

export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  // ... existing debug log ...
  const { account, topic } = args;

  const { data } = await api.post(
    `/api/topics/details`,
    { topic },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = TopicSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] getTopic parse error:', parseResult.error);
  }
  return data;
}

export async function markTopicAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: number;
}) {
  // ... existing code ...
  const { data } = await api.put(
    `/api/topics/read`,
    { topics: [topic], readUntil },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] markTopicAsRead parse error:', parseResult.error);
  }
  return data;
}

// For all remaining functions (markTopicAsUnread, pinTopic, unpinTopic, restoreTopic, deleteTopic):
// Replace the .parse(data) with:
  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] functionName parse error:', parseResult.error);
  }
  return data;
```

Changes made:
1. Replaced all `.parse(data)` calls with `.safeParse(data)`
2. Added error logging when parsing fails
3. Always return the original `data` regardless of parse result
4. Removed the console.log statements in getTopic function
5. Used consistent error logging format across all functions

The pattern is the same for all functions - we perform the safeParse, log any errors, but always return the original data. This maintains backward compatibility while adding validation logging.

---

_**User**_

give me the code for ALL functions

---

_**Assistant**_

Here's the complete code for all functions with the safeParse implementation:

```typescript:utils/api/topics.ts
export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  const parseResult = z.record(TopicSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] getTopics parse error:', parseResult.error);
  }
  return data;
}

export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] getTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.post(
    `/api/topics/details`,
    { topic },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = TopicSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] getTopic parse error:', parseResult.error);
  }
  return data;
}

export async function markTopicAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: number;
}) {
  logger.debug(
    `[API TOPICS] markTopicAsRead for account: ${args.account}, topic: ${args.topic}, readUntil: ${args.readUntil}`
  );
  const { account, topic, readUntil } = args;

  const { data } = await api.put(
    `/api/topics/read`,
    { topics: [topic], readUntil },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] markTopicAsRead parse error:', parseResult.error);
  }
  return data;
}

export async function markTopicAsUnread(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] markTopicAsUnread for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/unread`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] markTopicAsUnread parse error:', parseResult.error);
  }
  return data;
}

export async function pinTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] pinTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/pin`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] pinTopic parse error:', parseResult.error);
  }
  return data;
}

export async function unpinTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] unpinTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/unpin`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] unpinTopic parse error:', parseResult.error);
  }
  return data;
}

export async function restoreTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] restoreTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/restore`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] restoreTopic parse error:', parseResult.error);
  }
  return data;
}

export async function deleteTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] deleteTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const { data } = await api.delete(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
    data: { topics: [topic] },
  });

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[API TOPICS] deleteTopic parse error:', parseResult.error);
  }
  return data;
}
```

Changes made to all functions:
1. Replaced `.parse(data)` with `.safeParse(data)`
2. Added error logging using `logger.error` when parsing fails
3. Always return the original `data` regardless of parse result
4. Removed console.log statements
5. Used consistent error logging format across all functions

Each function now validates the response data using safeParse while maintaining the original behavior of returning the data even if validation fails. This allows us to log validation errors without breaking existing functionality.

---



---

