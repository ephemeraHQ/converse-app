import { DecryptedLocalAttachment } from "@xmtp/react-native-sdk"
import mime from "mime"
import RNFS from "react-native-fs"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { moveFileAndReplaceIfExist } from "@/utils/file-system/file-system"
import { getImageSize, isImageMimetype } from "@/utils/media"
import { LocalAttachmentMetadata } from "./conversation-attachments.types"
import { createAttachmentFolder, getAttachmentPaths } from "./conversation-attachments.utils"

export const getStoredRemoteAttachment = async (messageId: string) => {
  const { metadata: metadataPath } = getAttachmentPaths({ messageId })

  try {
    const exists = await RNFS.exists(metadataPath)
    if (!exists) return undefined

    const metadata = JSON.parse(
      await RNFS.readFile(metadataPath, "utf8"),
    ) as LocalAttachmentMetadata

    const { file: attachmentPath } = getAttachmentPaths({
      messageId,
      filename: metadata.filename,
    })

    const fileExists = await RNFS.exists(attachmentPath)
    return fileExists ? metadata : undefined
  } catch (error) {
    captureError(
      new GenericError({ error, additionalMessage: "Error getting stored remote attachment" }),
    )
  }
}

export const storeRemoteAttachment = async (args: {
  xmtpMessageId: IXmtpMessageId
  decryptedAttachment: DecryptedLocalAttachment
}) => {
  const { xmtpMessageId: messageId, decryptedAttachment } = args
  const { fileUri, filename: originalFilename, mimeType } = decryptedAttachment

  // Create folder
  await createAttachmentFolder({ messageId })

  // Get filename from attachment or extract from URI as fallback
  let filename = originalFilename || fileUri.split("/").slice(-1)[0]

  // Add extension if missing but we know the mime type
  if (mimeType) {
    const extension = mime.getExtension(mimeType)
    const hasExtension = filename.includes(".")
    if (extension && !hasExtension) {
      filename = `${filename}.${extension}`
    }
  }

  // Get paths
  const { file: destinationPath, metadata: metadataPath } = getAttachmentPaths({
    messageId,
    filename,
  })

  // Move file to permanent storage
  const normalizedFileUri = fileUri.replace(/^file:\/\/\/?/, "")
  await moveFileAndReplaceIfExist({
    filePath: normalizedFileUri,
    destPath: destinationPath,
  })

  // Create metadata
  const isImage = isImageMimetype(mimeType)
  const imageSize = isImage ? await getImageSize(`file://${destinationPath}`) : undefined

  const metadata: LocalAttachmentMetadata = {
    filename,
    mimeType,
    imageSize,
    mediaType: isImage ? "IMAGE" : "UNSUPPORTED",
    mediaURL: `file://${destinationPath}`,
    contentLength: 0,
  }

  // Save metadata
  await RNFS.writeFile(metadataPath, JSON.stringify(metadata), "utf8")

  return metadata
}
