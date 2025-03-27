import type { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { z } from "zod"
import { ensureCurrentUserQueryData } from "@/features/current-user/current-user.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

const ConversationMetadataSchema = z.object({
  deleted: z.boolean().optional(),
  pinned: z.boolean().optional(),
  unread: z.boolean().optional(),
  readUntil: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime(),
})

export type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>

export type IGetConversationMetadataArgs = {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}

export async function getConversationMetadata(args: IGetConversationMetadataArgs) {
  const { xmtpConversationId, clientInboxId } = args

  try {
    const currentUser = await ensureCurrentUserQueryData()

    if (!currentUser) {
      throw new Error("No current user found")
    }

    const deviceIdentityId = currentUser.identities.find(
      (identity) => identity.xmtpId === clientInboxId,
    )?.id

    if (!deviceIdentityId) {
      throw new Error("No matching device identity found for the given inbox ID")
    }

    const { data } = await convosApi.get<IConversationMetadata>(
      `/api/v1/metadata/conversation/${deviceIdentityId}/${xmtpConversationId}`,
    )

    const parseResult = ConversationMetadataSchema.safeParse(data)

    if (!parseResult.success) {
      captureError(
        new Error(
          `Failed to parse conversation metadata response: ${JSON.stringify(parseResult.error)} with data: ${JSON.stringify(data)}`,
        ),
      )
    }

    return data
  } catch (error) {
    // For other errors, rethrow
    throw error
  }
}

/**
 * Creates default metadata for a conversation when none exists (404 error case)
 */
// async function createDefaultConversationMetadata(args: {
//   xmtpConversationId: IXmtpConversationId
//   clientInboxId?: IXmtpInboxId
// }) {
//   const { xmtpConversationId, clientInboxId } = args

//   // If clientInboxId is provided, use it. Otherwise, try to get the current inbox ID.
//   let inboxId = clientInboxId
//   if (!inboxId) {
//     const currentSender = useMultiInboxStore.getState().currentSender
//     if (!currentSender) {
//       throw new Error("No current sender found to create conversation metadata")
//     }
//     inboxId = currentSender.inboxId
//   }

//   // Create metadata with default values
//   return updateConversationMetadata({
//     xmtpConversationId,
//     clientInboxId: inboxId,
//     updates: {
//       deleted: false,
//       pinned: false,
//       unread: true,
//     },
//   })
// }

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

  const currentUser = await ensureCurrentUserQueryData()

  if (!currentUser) {
    throw new Error("No current user found")
  }

  const { data } = await convosApi.post<IConversationMetadata>(`/api/v1/metadata/conversation`, {
    conversationId: xmtpConversationId,
    deviceIdentityId: currentUser.identities.find((identity) => identity.xmtpId === clientInboxId)
      ?.id,
    ...updates,
  })

  const parseResult = ConversationMetadataSchema.safeParse(data)

  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse metadata update response: ${JSON.stringify(parseResult.error)} with data: ${JSON.stringify(data)}`,
      ),
    )
  }

  return data
}
