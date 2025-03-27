import { queryOptions, useQuery } from "@tanstack/react-query"
import { memo } from "react"
import { Image } from "@/design-system/image"
import { Text } from "@/design-system/Text"
import { AttachmentLoading } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachment-loading"
import { getAttachmentPaths } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachments.utils"
import { ConversationMessageAttachmentContainer } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-message-attachment-container"
import { processAndSaveLocalAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/process-and-save-local-attachment"
import { translate } from "@/i18n"
import { createFolderIfNotExists, saveFile } from "@/utils/file-system/file-system"
import {
  IConversationMessageStaticAttachment,
  IConversationMessageStaticAttachmentContent,
} from "../conversation-message/conversation-message.types"

type IMessageStaticAttachmentProps = {
  message: IConversationMessageStaticAttachment
}

export const ConversationMessageStaticAttachment = memo(
  function ConversationMessageStaticAttachment({ message }: IMessageStaticAttachmentProps) {
    const content = message.content

    if (typeof content === "string") {
      // TODO
      return null
    }

    return <Content messageId={message.xmtpId} staticAttachment={content} />
  },
)

const Content = memo(function Content(props: {
  messageId: string
  staticAttachment: IConversationMessageStaticAttachmentContent
}) {
  const { messageId, staticAttachment } = props

  const {
    data: attachment,
    isLoading: attachmentLoading,
    error: attachmentError,
  } = useQuery(getStaticAttachmentQueryOptions({ messageId, staticAttachment }))

  if (!attachment && attachmentLoading) {
    return (
      <ConversationMessageAttachmentContainer>
        <AttachmentLoading />
      </ConversationMessageAttachmentContainer>
    )
  }

  if (attachmentError || !attachment) {
    return (
      <ConversationMessageAttachmentContainer>
        <Text>{translate("attachment_not_found")}</Text>
      </ConversationMessageAttachmentContainer>
    )
  }

  const aspectRatio = attachment.imageSize
    ? attachment.imageSize.width / attachment.imageSize.height
    : undefined

  return (
    <ConversationMessageAttachmentContainer style={{ aspectRatio }}>
      <Image
        source={{ uri: attachment.mediaURL }}
        contentFit="cover"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </ConversationMessageAttachmentContainer>
  )
})

function getStaticAttachmentQueryOptions(args: {
  messageId: string
  staticAttachment: IConversationMessageStaticAttachmentContent
}) {
  const { messageId, staticAttachment } = args

  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["static-attachment", messageId],
    queryFn: async () => {
      const paths = getAttachmentPaths({ messageId })

      await createFolderIfNotExists({
        path: paths.folder,
        options: {
          NSURLIsExcludedFromBackupKey: true,
        },
      })

      await saveFile({
        path: paths.file,
        data: staticAttachment.data,
        encodingOrOptions: "base64",
      })

      return processAndSaveLocalAttachment({
        messageId,
        filename: staticAttachment.filename,
        mimeType: staticAttachment.mimeType,
      })
    },
  })
}
