import { queryOptions, useQuery } from "@tanstack/react-query"
import { downloadRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/download-remote-attachment"
import {
  getStoredRemoteAttachment,
  storeRemoteAttachment,
} from "@/features/conversation/conversation-chat/conversation-attachment/remote-attachment-local-storage"
import { decryptAttachment } from "@/features/xmtp/xmtp-codecs/xmtp-codecs-attachments"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { IConversationMessageRemoteAttachmentContent } from "../conversation-message/conversation-message.types"

export function useRemoteAttachmentQuery(args: {
  xmtpMessageId: IXmtpMessageId
  content: IConversationMessageRemoteAttachmentContent
}) {
  return useQuery(getRemoteAttachmentQueryOptions(args))
}

export function getRemoteAttachmentQueryOptions(args: {
  xmtpMessageId: IXmtpMessageId
  content: IConversationMessageRemoteAttachmentContent
}) {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["remote-attachment", args.xmtpMessageId, args.content.url],
    queryFn: () => fetchRemoteAttachment(args),
    enabled: !!args.xmtpMessageId,
  })
}

async function fetchRemoteAttachment(args: {
  xmtpMessageId: IXmtpMessageId
  content: IConversationMessageRemoteAttachmentContent
}) {
  const { xmtpMessageId, content } = args

  // Check local cache first
  const storedAttachment = await getStoredRemoteAttachment(xmtpMessageId)

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
    xmtpMessageId,
    decryptedAttachment,
  })
}
