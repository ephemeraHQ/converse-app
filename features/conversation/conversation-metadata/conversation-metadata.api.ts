import type { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { z } from "zod"
import { getConversationIdFromTopic } from "@/features/conversation/utils/get-conversation-id-from-topic"
import { getCurrentUserQueryData } from "@/features/current-user/curent-user.query"
import { api } from "@/utils/api/api"
import { captureError } from "@/utils/capture-error"
import type { IConversationTopic } from "../conversation.types"

const ConversationMetadataSchema = z.object({
  deleted: z.boolean(),
  pinned: z.boolean(),
  unread: z.boolean(),
  readUntil: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
})

export type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>

// export async function getConversationMetadatas(args: {
//   account: string;
//   topics: IXmtpConversationTopic[];
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

export async function getConversationMetadata(args: { topic: IConversationTopic }) {
  const { topic } = args

  const conversationId = await getConversationId({ topic })

  const { data } = await api.get<IConversationMetadata>(
    `/api/v1/metadata/conversation/${conversationId}`,
  )

  const parseResult = ConversationMetadataSchema.safeParse(data)

  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse conversation metadata response: ${JSON.stringify(parseResult.error)}`,
      ),
    )
  }

  return data
}

export async function markConversationMetadataAsRead(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  readUntil: string
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    updates: {
      unread: false,
      readUntil: args.readUntil,
    },
  })
}

export async function markConversationMetadataAsUnread(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    updates: {
      unread: true,
    },
  })
}

export async function pinConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    updates: {
      pinned: true,
    },
  })
}

export async function unpinConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    updates: {
      pinned: false,
    },
  })
}

export async function restoreConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    updates: {
      deleted: false,
    },
  })
}

export async function deleteConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    topic: args.topic,
    updates: {
      deleted: true,
    },
  })
}

/**
 * Helper functions
 */
async function getConversationId(args: { topic: IConversationTopic }) {
  const { topic } = args

  const conversationId = getConversationIdFromTopic(topic)

  if (!conversationId) {
    throw new Error(`Conversation ID not found for topic: ${topic}`)
  }

  return conversationId
}

async function updateConversationMetadata(args: {
  topic: IConversationTopic
  clientInboxId: IXmtpInboxId
  updates: {
    pinned?: boolean
    unread?: boolean
    deleted?: boolean
    readUntil?: string
  }
}) {
  const { topic, clientInboxId, updates } = args

  const conversationId = await getConversationId({ topic })

  const currentUser = getCurrentUserQueryData()

  if (!currentUser) {
    throw new Error("No current user found")
  }

  const { data } = await api.post<IConversationMetadata>(`/api/v1/metadata/conversation`, {
    conversationId,
    deviceIdentityId: currentUser.identities.find((identity) => identity.xmtpId === clientInboxId)
      ?.id,
    ...updates,
  })

  const parseResult = ConversationMetadataSchema.safeParse(data)
  if (!parseResult.success) {
    captureError(
      new Error(`Failed to parse metadata update response: ${JSON.stringify(parseResult.error)}`),
    )
  }

  return data
}
