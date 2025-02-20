import { getCurrentUserQueryData } from "@/features/current-user/curent-user.query";
import { getOrFetchConversation } from "@/queries/conversation-query";
import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { z } from "zod";

const ConversationMetadataSchema = z.object({
  deleted: z.boolean(),
  pinned: z.boolean(),
  unread: z.boolean(),
  readUntil: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

// export type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>;

// export async function getConversationMetadatas(args: {
//   account: string;
//   topics: ConversationTopic[];
// }) {
//   const { account, topics } = args;

//   const conversationIds = await Promise.all(
//     topics.map((topic) => getConversationId({ account, topic }))
//   );

//   const { data } = await api.post(`/api/v1/metadata/conversations`, {
//     conversationIds,
//   });

//   const parseResult = z.record(ConversationMetadataSchema).safeParse(data);
//   if (!parseResult.success) {
//     captureError(
//       new Error(
//         `Failed to parse conversation metadatas response: ${JSON.stringify(
//           parseResult.error
//         )}`
//       )
//     );
//   }

//   return data as Record<string, IConversationMetadata>;
// }

export async function getConversationMetadata(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  const conversationId = await getConversationId({ account, topic });

  const { data } = await api.get(
    `/api/v1/metadata/conversation/${conversationId}`
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse conversation metadata response: ${JSON.stringify(
          parseResult.error
        )}`
      )
    );
  }

  return data as IConversationMetadata;
}

export async function markConversationAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: string;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      unread: false,
      readUntil: args.readUntil,
    },
  });
}

export async function markConversationAsUnread(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      unread: true,
    },
  });
}

export async function pinConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      pinned: true,
    },
  });
}

export async function unpinConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      pinned: false,
    },
  });
}

export async function restoreConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      deleted: false,
    },
  });
}

export async function deleteConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      deleted: true,
    },
  });
}

/**
 * Helper functions
 */
async function getConversationId(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const conversation = await getOrFetchConversation({
    account: args.account,
    topic: args.topic,
    caller: "conversation-metadata.api",
  });

  if (!conversation) {
    throw new Error(`Conversation not found for topic: ${args.topic}`);
  }

  return conversation.id;
}

async function updateConversationMetadata(args: {
  account: string;
  topic: ConversationTopic;
  updates: {
    pinned?: boolean;
    unread?: boolean;
    deleted?: boolean;
    readUntil?: string;
  };
}) {
  const { account, topic, updates } = args;

  const conversationId = await getConversationId({ account, topic });

  const currentUser = getCurrentUserQueryData();

  if (!currentUser) {
    throw new Error("No current user found");
  }

  const { data } = await api.post(`/api/v1/metadata/conversation`, {
    conversationId,
    deviceIdentityId: currentUser.identities.find(
      (identity) => identity.privyAddress === account
    )?.id,
    ...updates,
  });

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse metadata update response: ${JSON.stringify(
          parseResult.error
        )}`
      )
    );
  }

  return data as IConversationMetadata;
}
