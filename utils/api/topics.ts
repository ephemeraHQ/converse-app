import { api } from "@/utils/api/api";
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

export async function getTopics(args: { topics: ConversationTopic[] }) {
  const { topics } = args;

  // Doing POST because we need to pass in the topics array
  const { data } = await api.post(`/api/topics`, { topics });

  const parseResult = z.record(TopicSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getTopics parse error:",
      JSON.stringify(parseResult.error)
    );
  }

  return data as Record<string, ITopic>;
}

export async function getAllTopics() {
  const { data } = await api.get(`/api/topics`);

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
export async function getTopic(args: { topic: ConversationTopic }) {
  const { topic } = args;

  const { data } = await api.post(`/api/topics/details`, { topic });

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
  const { topic, readUntil } = args;

  const { data } = await api.put(`/api/topics/read`, {
    topics: [topic],
    readUntil,
  });

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] markTopicAsRead parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function markTopicAsUnread(args: { topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] markTopicAsUnread for topic: ${args.topic}`);
  const { topic } = args;

  const { data } = await api.put(`/api/topics/unread`, { topics: [topic] });

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] markTopicAsUnread parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function pinTopic(args: { topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] pinTopic for topic: ${args.topic}`);
  const { topic } = args;

  const { data } = await api.put(`/api/topics/pin`, { topics: [topic] });

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] pinTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function unpinTopic(args: { topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] unpinTopic for topic: ${args.topic}`);
  const { topic } = args;

  const { data } = await api.put(`/api/topics/unpin`, { topics: [topic] });

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] unpinTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function restoreTopic(args: { topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] restoreTopic for topic: ${args.topic}`);
  const { topic } = args;

  const { data } = await api.put(`/api/topics/restore`, { topics: [topic] });

  const parseResult = MessageResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] restoreTopic parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as IMessageResponse;
}

export async function deleteTopic(args: { topic: ConversationTopic }) {
  logger.debug(`[API TOPICS] deleteTopic for topic: ${args.topic}`);
  const { topic } = args;

  const { data } = await api.delete(`/api/topics`, {
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
