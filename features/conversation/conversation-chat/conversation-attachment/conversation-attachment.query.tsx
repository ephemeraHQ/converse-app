import { queryOptions, useQuery } from "@tanstack/react-query"
import { downloadRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/download-remote-attachment"
import {
  getStoredRemoteAttachment,
  storeRemoteAttachment,
} from "@/features/conversation/conversation-chat/conversation-attachment/remote-attachment-local-storage"
import { decryptAttachment } from "@/features/xmtp/xmtp-codecs/xmtp-codecs-attachments"
import {
  IConversationMessageId,
  IConversationMessageRemoteAttachmentContent,
} from "../conversation-message/conversation-message.types"

export function useRemoteAttachmentQuery(args: {
  messageId: IConversationMessageId
  content: IConversationMessageRemoteAttachmentContent
}) {
  return useQuery(getRemoteAttachmentQueryOptions(args))
}

export function getRemoteAttachmentQueryOptions(args: {
  messageId: IConversationMessageId
  content: IConversationMessageRemoteAttachmentContent
}) {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["remote-attachment", args.messageId, args.content.url],
    queryFn: () => fetchRemoteAttachment(args),
    enabled: !!args.messageId,
  })
}

async function fetchRemoteAttachment(args: {
  messageId: IConversationMessageId
  content: IConversationMessageRemoteAttachmentContent
}) {
  const { messageId, content } = args

  // Check local cache first
  const storedAttachment = await getStoredRemoteAttachment(messageId)

  if (storedAttachment) {
    return storedAttachment
  }

  const encryptedLocalFileUri = await downloadRemoteAttachment({
    url: content.url,
  })

  const decryptedAttachment = await decryptAttachment({
    encryptedLocalFileUri: encryptedLocalFileUri,
    metadata: content,
  })

  return storeRemoteAttachment({
    messageId,
    decryptedAttachment,
  })
}
