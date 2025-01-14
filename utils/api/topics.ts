import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { z } from "zod";
import { api, getXmtpApiHeaders } from "../api";
import logger from "@/utils/logger";

// Response schemas
const MessageResponseSchema = z.object({
  message: z.string(),
});

const TopicSchema = z.object({
  isDeleted: z.boolean(),
  isPinned: z.boolean(),
  markedAsUnread: z.boolean(),
  readUntil: z.number().optional(),
  timestamp: z.number().optional(),
  /** @deprecated */
  status: z.enum(["unread", "read", "deleted"]).optional().nullable(),
});

export async function getTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  const parseResult = z.record(TopicSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error("[API TOPICS] getTopics parse error:", parseResult.error);
  }
  return data as Record<string, z.infer<typeof TopicSchema>>;
}

// API functions
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
    logger.error("[API TOPICS] getTopic parse error:", parseResult.error);
  }
  return data as z.infer<typeof TopicSchema>;
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
    logger.error(
      "[API TOPICS] markTopicAsRead parse error:",
      parseResult.error
    );
  }
  return data as z.infer<typeof MessageResponseSchema>;
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
    logger.error(
      "[API TOPICS] markTopicAsUnread parse error:",
      parseResult.error
    );
  }
  return data as z.infer<typeof MessageResponseSchema>;
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
    logger.error("[API TOPICS] pinTopic parse error:", parseResult.error);
  }
  return data as z.infer<typeof MessageResponseSchema>;
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
    logger.error("[API TOPICS] unpinTopic parse error:", parseResult.error);
  }
  return data as z.infer<typeof MessageResponseSchema>;
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
    logger.error("[API TOPICS] restoreTopic parse error:", parseResult.error);
  }
  return data as z.infer<typeof MessageResponseSchema>;
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
    logger.error("[API TOPICS] deleteTopic parse error:", parseResult.error);
  }
  return data as z.infer<typeof MessageResponseSchema>;
}
