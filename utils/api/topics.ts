import { api } from "@/utils/api/api";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import logger from "@/utils/logger";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { z } from "zod";

const MessageResponseSchema = z.object({
  message: z.string(),
});

type IMessageResponse = z.infer<typeof MessageResponseSchema>;

const TopicSchema = z.object({
  isDeleted: z.boolean(),
  isPinned: z.boolean(),
  markedAsUnread: z.boolean(),
  readUntil: z.number().optional(),
  timestamp: z.number().optional(),
  /** @deprecated */
  status: z.enum(["unread", "read", "deleted"]).optional().nullable(),
});

type ITopic = z.infer<typeof TopicSchema>;

export async function getTopics(args: {
  account: string;
  topics: ConversationTopic[];
}) {
  logger.debug(`[API TOPICS] getTopics for account: ${args.account}`);
  const { account, topics } = args;

  // Doing POST because we need to pass in the topics array
  const { data } = await api.post(
    `/api/topics`,
    { topics },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = z.record(TopicSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getTopics parse error:",
      JSON.stringify(parseResult.error)
    );
  }

  return data as Record<string, ITopic>;
}

export async function getAllTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getAllTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  const parseResult = z.record(TopicSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getAllTopics parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as Record<string, ITopic>;
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
    logger.error(
      "[API TOPICS] getTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as ITopic;
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
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
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
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function pinTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] pinTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const headers = await getXmtpApiHeaders(account);

  const { data } = await api.put(
    `/api/topics/pin`,
    { topics: [topic] },
    { headers: headers }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] pinTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function unpinTopic(args: {
  account: string;
  topic: ConversationTopic;
}) {
  logger.debug(
    `[API TOPICS] unpinTopic for account: ${args.account}, topic: ${args.topic}`
  );
  const { account, topic } = args;

  const headers = await getXmtpApiHeaders(account);

  const { data } = await api.put(
    `/api/topics/unpin`,
    { topics: [topic] },
    { headers: headers }
  );

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] unpinTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
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
    logger.error(
      "[API TOPICS] restoreTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
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
    logger.error(
      "[API TOPICS] deleteTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}
