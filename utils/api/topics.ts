import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { z } from "zod";
import { api, getXmtpApiHeaders } from "../api";

// Response schemas
const MessageResponseSchema = z.object({
  message: z.string(),
});

const TopicSchema = z.object({
  isDeleted: z.boolean(),
  readUntil: z.number().nullable(),
  isPinned: z.boolean(),
  timestamp: z.number().optional(),
});

export async function getTopics(args: { account: string }) {
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  return z.record(TopicSchema).parse(data);
}

// API functions
export async function getTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.post(
    `/api/topics/details`,
    {
      topic,
    },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );

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
}) {
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/pin`,
    { topics: [topic] },
    { headers: await getXmtpApiHeaders(account) }
  );

  return MessageResponseSchema.parse(data);
}

export async function unpinTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;

  const { data } = await api.put(
    `/api/topics/unpin`,
    { topics: [topic] },
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
