import type { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { z } from "zod"
import { getCurrentUserQueryData } from "@/features/current-user/curent-user.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { api } from "@/utils/api/api"
import { captureError } from "@/utils/capture-error"

const ConversationMetadataSchema = z.object({
  deleted: z.boolean(),
  pinned: z.boolean(),
  unread: z.boolean(),
  readUntil: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
})

export type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>

export async function getConversationMetadata(args: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = args

  const { data } = await api.get<IConversationMetadata>(
    `/api/v1/metadata/conversation/${xmtpConversationId}`,
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
  xmtpConversationId: IXmtpConversationId
  readUntil: string
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    updates: {
      unread: false,
      readUntil: args.readUntil,
    },
  })
}

export async function markConversationMetadataAsUnread(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    updates: {
      unread: true,
    },
  })
}

export async function pinConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    updates: {
      pinned: true,
    },
  })
}

export async function unpinConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    updates: {
      pinned: false,
    },
  })
}

export async function restoreConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    updates: {
      deleted: false,
    },
  })
}

export async function deleteConversationMetadata(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  return updateConversationMetadata({
    clientInboxId: args.clientInboxId,
    xmtpConversationId: args.xmtpConversationId,
    updates: {
      deleted: true,
    },
  })
}

async function updateConversationMetadata(args: {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
  updates: {
    pinned?: boolean
    unread?: boolean
    deleted?: boolean
    readUntil?: string
  }
}) {
  const { xmtpConversationId, clientInboxId, updates } = args

  const currentUser = getCurrentUserQueryData()

  if (!currentUser) {
    throw new Error("No current user found")
  }

  const { data } = await api.post<IConversationMetadata>(`/api/v1/metadata/conversation`, {
    conversationId: xmtpConversationId,
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
