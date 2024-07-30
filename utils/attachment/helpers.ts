import { getLocalAttachment } from "./index";
import { isContentType } from "../xmtpRN/contentTypes";

export const isAttachmentMessage = (contentType?: string) =>
  contentType
    ? isContentType("attachment", contentType) ||
      isContentType("remoteAttachment", contentType)
    : false;

export const fetchLocalAttachmentUrl = async (messageId: string) => {
  const localAttachment = await getLocalAttachment(messageId);
  if (localAttachment && localAttachment.mediaType === "IMAGE") {
    return localAttachment.mediaURL;
  }
  return undefined;
};
