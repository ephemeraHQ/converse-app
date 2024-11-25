import {
  getMessageAttachmentLocalPath,
  getMessageAttachmentLocalMetadataPath,
  saveLocalAttachmentMetaData,
} from "@utils/attachment/attachment.utils";
import { LocalAttachmentMetadata } from "@utils/attachment/types";
import RNFS from "react-native-fs";
import { getImageSize, isImageMimetype } from "../media";

export const getLocalAttachment = async (
  messageId: string,
  filename: string,
  mimeType: string | undefined
) => {
  const attachmentPath = getMessageAttachmentLocalPath(messageId, filename);
  const attachmentJsonPath = getMessageAttachmentLocalMetadataPath(messageId);
  const isImage = isImageMimetype(mimeType);

  const imageSize = isImage
    ? await getImageSize(`file://${attachmentPath}`)
    : undefined;

  const attachmentMetaData: LocalAttachmentMetadata = {
    filename,
    mimeType,
    imageSize,
  };

  await RNFS.writeFile(
    attachmentJsonPath,
    JSON.stringify(attachmentMetaData),
    "utf8"
  );

  await saveLocalAttachmentMetaData({
    messageId,
    filename,
    mimeType,
  });

  return {
    mediaType: isImage
      ? "IMAGE"
      : ("UNSUPPORTED" as "IMAGE" | "UNSUPPORTED" | undefined),
    imageSize,
    contentLength: 0,
    mediaURL: `file://${attachmentPath}`,
    filename,
    mimeType: mimeType || "",
  };
};
