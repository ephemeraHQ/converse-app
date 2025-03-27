import { saveFile } from "@/utils/file-system/file-system"
import { getImageSize, isImageMimetype } from "@/utils/media"
import { LocalAttachmentMetadata } from "./conversation-attachments.types"
import { getAttachmentPaths } from "./conversation-attachments.utils"

type GetAttachmentDetailsArgs = {
  messageId: string
  filename: string
  mimeType: string | undefined
}

/**
 * Gets metadata and details for a local attachment file
 */
async function getAttachmentDetails(args: GetAttachmentDetailsArgs) {
  const { messageId, filename, mimeType } = args
  const { file: attachmentPath } = getAttachmentPaths({ messageId, filename })

  const isImage = isImageMimetype(mimeType)
  const imageSize = isImage ? await getImageSize(`file://${attachmentPath}`) : undefined

  const metadata: LocalAttachmentMetadata = {
    filename,
    mimeType,
    imageSize,
    mediaType: isImage ? "IMAGE" : "UNSUPPORTED",
    mediaURL: `file://${attachmentPath}`,
    contentLength: 0,
  }

  return {
    attachmentMetaData: metadata,
    attachmentDetails: {
      ...metadata,
      mimeType: mimeType ?? "",
    },
  }
}

/**
 * Gets details for a local attachment and saves its metadata
 * Used when handling message attachments like images
 */
export const processAndSaveLocalAttachment = async (args: GetAttachmentDetailsArgs) => {
  const { attachmentMetaData, attachmentDetails } = await getAttachmentDetails(args)
  const { metadata: metadataPath } = getAttachmentPaths({ messageId: args.messageId })

  await saveFile({
    path: metadataPath,
    data: JSON.stringify(attachmentMetaData),
    encodingOrOptions: "utf8",
  })

  return attachmentDetails
}
