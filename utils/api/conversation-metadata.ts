import { api } from "@/utils/api/api";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import logger from "@/utils/logger";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { z } from "zod";

const ConversationMetadataSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  deviceIdentityId: z.string(),
  pinned: z.boolean().default(false),
  unread: z.boolean().default(false),
  deleted: z.boolean().default(false),
  readUntil: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>;

export async function getConversationsMetadata(args: {
  account: string;
  deviceIdentityId: string;
}) {
  logger.debug(
    `[API TOPICS] getConversations for deviceIdentityId: ${args.deviceIdentityId}`
  );
  const { deviceIdentityId } = args;

  const { data } = await api.get(
    `/metadata/conversation/device/${deviceIdentityId}`,
    { headers: await getXmtpApiHeaders(args.account) }
  );

  const parseResult = z.array(ConversationMetadataSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getConversations parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse conversation metadata");
  }

  return parseResult.data;
}

export async function getAllTopics(args: { account: string }) {
  logger.debug(`[API TOPICS] getAllTopics for account: ${args.account}`);
  const { account } = args;

  const { data } = await api.get(`/api/topics`, {
    headers: await getXmtpApiHeaders(account),
  });

  const parseResult = z.record(ConversationMetadataSchema).safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getAllTopics parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return data as Record<string, IConversationMetadata>;
}

// API functions
export async function getTopic(args: {
  account: string;
  conversationId: string;
  deviceIdentityId: string;
}) {
  logger.debug(
    `[API TOPICS] getTopic for deviceIdentityId: ${args.deviceIdentityId}, conversationId: ${args.conversationId}`
  );
  const { deviceIdentityId, conversationId } = args;

  const { data } = await api.get(
    `/metadata/conversation/${deviceIdentityId}/${conversationId}`,
    { headers: await getXmtpApiHeaders(args.account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] getTopic parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse conversation metadata");
  }
  return parseResult.data;
}

export async function markTopicAsRead(args: {
  account: string;
  conversationId: string;
  deviceIdentityId: string;
  readUntil: string;
}) {
  logger.debug(
    `[API TOPICS] markTopicAsRead for deviceIdentityId: ${args.deviceIdentityId}, conversationId: ${args.conversationId}`
  );
  const { account, deviceIdentityId, conversationId, readUntil } = args;

  const { data } = await api.put(
    `/metadata/conversation/${deviceIdentityId}/${conversationId}`,
    { readUntil, unread: false },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] markTopicAsRead parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to mark topic as read");
  }
  return parseResult.data;
}

export async function markTopicAsUnread(args: {
  account: string;
  conversationId: string;
}) {
  logger.debug(
    `[API TOPICS] markTopicAsUnread for account: ${args.account}, conversationId: ${args.conversationId}`
  );
  const { account, conversationId } = args;

  const { data } = await api.put(
    `/metadata/conversation/${conversationId}`,
    { unread: true },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] markTopicAsUnread parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to mark topic as unread");
  }
  return data;
}

export async function pinTopic(args: {
  account: string;
  conversationId: string;
}) {
  logger.debug(
    `[API TOPICS] pinTopic for account: ${args.account}, conversationId: ${args.conversationId}`
  );
  const { account, conversationId } = args;

  const { data } = await api.put(
    `/metadata/conversation/${conversationId}`,
    { pinned: true },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] pinTopic parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to pin topic");
  }
  return data;
}

export async function unpinTopic(args: {
  account: string;
  conversationId: string;
}) {
  logger.debug(
    `[API TOPICS] unpinTopic for account: ${args.account}, conversationId: ${args.conversationId}`
  );
  const { account, conversationId } = args;

  const { data } = await api.put(
    `/metadata/conversation/${conversationId}`,
    { pinned: false },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] unpinTopic parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to unpin topic");
  }
  return data;
}

export async function restoreTopic(args: {
  account: string;
  conversationId: string;
}) {
  logger.debug(
    `[API TOPICS] restoreTopic for account: ${args.account}, conversationId: ${args.conversationId}`
  );
  const { account, conversationId } = args;

  const { data } = await api.put(
    `/metadata/conversation/${conversationId}`,
    { deleted: false },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] restoreTopic parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to restore topic");
  }
  return data;
}

export async function deleteTopic(args: {
  account: string;
  conversationId: string;
}) {
  logger.debug(
    `[API TOPICS] deleteTopic for account: ${args.account}, conversationId: ${args.conversationId}`
  );
  const { account, conversationId } = args;

  const { data } = await api.put(
    `/metadata/conversation/${conversationId}`,
    { deleted: true },
    { headers: await getXmtpApiHeaders(account) }
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API TOPICS] deleteTopic parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to delete topic");
  }
  return data;
}
