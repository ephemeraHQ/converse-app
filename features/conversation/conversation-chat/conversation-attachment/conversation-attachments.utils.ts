import RNFS from "react-native-fs"
import { LocalAttachmentMetadata } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachments.types"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"

/**
 * Gets all paths related to a message attachment
 */
export function getAttachmentPaths(args: { messageId: string; filename?: string }) {
  const { messageId, filename } = args
  const folder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`

  return {
    folder,
    metadata: `${folder}/attachment.json`,
    file: filename ? `${folder}/${filename}` : "",
  }
}

/**
 * Creates the necessary folder structure for a message attachment
 */
export async function createAttachmentFolder(args: { messageId: string }) {
  const { folder } = getAttachmentPaths({ messageId: args.messageId })
  await RNFS.mkdir(folder, {
    NSURLIsExcludedFromBackupKey: true,
  })
}

/**
 * Gets metadata for a local attachment
 */
export async function getLocalAttachmentMetadata(args: { messageId: IXmtpMessageId }) {
  const { metadata: metadataPath } = getAttachmentPaths({ messageId: args.messageId })
  const attachmentMetadata = await RNFS.readFile(metadataPath, "utf8")
  return JSON.parse(attachmentMetadata) as LocalAttachmentMetadata
}

// export async function saveLocalAttachmentMetaData(args: {
//   messageId: string
//   filename: string
//   mimeType: string | undefined
// }) {
//   const { messageId, filename, mimeType } = args

//   const attachmentPath = getMessageAttachmentLocalPath({ messageId, filename })
//   const attachmentJsonPath = getMessageAttachmentLocalMetadataPath({ messageId })
//   const isImage = isImageMimetype(mimeType)

//   const imageSize = isImage ? await getImageSize(`file://${attachmentPath}`) : undefined

//   const attachmentMetaData: LocalAttachmentMetadata = {
//     filename,
//     mimeType,
//     imageSize,
//     mediaType: isImage ? "IMAGE" : "UNSUPPORTED",
//     mediaURL: attachmentPath,
//     contentLength: isImage ? imageSize?.width * imageSize?.height : undefined,
//   }

//   await RNFS.writeFile(attachmentJsonPath, JSON.stringify(attachmentMetaData), "utf8")
// }

// export async function saveLocalAttachment(args: { attachment: LocalAttachment }) {
//   const { attachment } = args

//   if (!attachment) {
//     throw new Error("No attachment provided")
//   }

//   const messageId = uuidv4() // Generate temporary ID for local storage

//   return storeRemoteAttachment({
//     messageId,
//     decryptedAttachment: {
//       fileUri: attachment.mediaURI,
//       mimeType: attachment.mimeType,
//       filename: attachment.mediaURI.split("/").pop() || `${uuidv4()}`,
//     },
//   })
// }
