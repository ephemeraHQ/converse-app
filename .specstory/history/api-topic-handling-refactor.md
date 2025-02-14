## SpecStory

## API Topic Handling Refactor (1/13/2025, 3:07:36 PM)

_**User**_

ok fix all this so that topic isn't passed in url anymore but in the body, and make sure to pass it as string array so like topics: [topic]

---

_**Assistant**_

I'll help modify the API functions to pass the topic in the request body as a string array. Here are the necessary changes:

```typescript:utils/api/topics.ts
// ... existing schemas ...

export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.post(`/api/topics/get`, {
    topics: [topic],
  }, {
    headers: await getXmtpApiHeaders(account),
  });

  return TopicSchema.parse(data);
}

export async function markTopicAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: number;
}) {
  const { account, topic, readUntil } = args;

  const { data } = await api.put(
    `/api/topics/read`,
    { topics: [topic], readUntil },
    { headers: await getXmtpApiHeaders(account) }
  );

  return MessageResponseSchema.parse(data);
}

export async function markTopicAsUnread(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/unread`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  return MessageResponseSchema.parse(data);
}

export async function pinTopic(args: {
  account: string;
  topic: ConversationTopic;
  isPinned: boolean;
}) {
  const { account, topic, isPinned } = args;

  const { data } = await api.put(
    `/api/topics/pin`,
    { topics: [topic], isPinned },
    { headers: await getXmtpApiHeaders(account) }
  );

  return MessageResponseSchema.parse(data);
}

export async function restoreTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/restore`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  return MessageResponseSchema.parse(data);
}

export async function deleteTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.delete(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
    data: { topics: [topic] },
  });

  return MessageResponseSchema.parse(data);
}

// ... getTopics function remains unchanged ...
```

Key changes made:
1. Removed topic from URL paths
2. Added topics array in request body containing the single topic
3. Changed GET request for `getTopic` to POST since we're sending data in body
4. For DELETE request, added `data` property to include request body
5. Updated all endpoints to use more RESTful paths without parameters

The `getTopics` function remains unchanged since it doesn't deal with individual topics.

---



---

