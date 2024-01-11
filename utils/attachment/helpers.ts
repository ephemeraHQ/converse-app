import { isContentType } from "../xmtpRN/contentTypes";

export const isAttachmentMessage = (contentType?: string) =>
  contentType
    ? isContentType("attachment", contentType) ||
      isContentType("remoteAttachment", contentType)
    : false;
