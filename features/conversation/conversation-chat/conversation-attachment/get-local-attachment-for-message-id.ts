// import { logger } from "@utils/logger"
// import RNFS from "react-native-fs"
// import { isImageMimetype } from "@/utils/media"

// export const getLocalAttachmentForMessageId = async (messageId: string) => {
//   const attachmentJsonPath = getMessageAttachmentLocalMetadataPath(messageId)

//   const attachmentExists = await RNFS.exists(attachmentJsonPath)

//   console.log("attachmentExists:", attachmentExists)

//   if (attachmentExists) {
//     try {
//       const attachmentMetaData = await getLocalAttachmentMetaData(messageId)

//       // Check if attachment is an image
//       const supportedMediaType = isImageMimetype(attachmentMetaData.mimeType)

//       // Get path to actual attachment file
//       const attachmentLocalPath = getMessageAttachmentLocalPath(
//         messageId,
//         attachmentMetaData.filename,
//       )

//       const fileExists = await RNFS.exists(attachmentLocalPath)

//       if (fileExists) {
//         // Return attachment metadata and local file path if file exists
//         return {
//           mediaType: (supportedMediaType ? "IMAGE" : "UNSUPPORTED") as
//             | "IMAGE"
//             | "UNSUPPORTED"
//             | undefined,
//           mimeType: attachmentMetaData.mimeType,
//           imageSize: attachmentMetaData.imageSize,
//           mediaURL: `file://${attachmentLocalPath}`,
//           contentLength: 0,
//           filename: attachmentMetaData.filename,
//         }
//       } else {
//         logger.debug(`Attachment file does not exist: ${attachmentLocalPath}`)
//       }
//     } catch (e) {
//       logger.warn(e)
//     }
//   } else {
//     logger.debug(`No attachment metadata found for messageId: ${messageId}`)
//   }
// }
