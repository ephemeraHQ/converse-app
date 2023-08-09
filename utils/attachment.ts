import { RemoteAttachment } from "@xmtp/content-type-remote-attachment";

export type SerializedAttachmentContent = {
  filename: string;
  mimeType: string;
  data: string;
};

export type SerializedRemoteAttachmentContent = {
  nonce: string;
  salt: string;
  secret: string;
  url: string;
  contentDigest: string;
  scheme: string;
  contentLength: number;
  filename: string;
};

export const deserializeRemoteAttachmentContent = (
  serializedRemoteAttachment: string
): RemoteAttachment => {
  const parsedAttachment: SerializedRemoteAttachmentContent = JSON.parse(
    serializedRemoteAttachment
  );
  return {
    ...parsedAttachment,
    nonce: Buffer.from(parsedAttachment.nonce, "base64"),
    salt: Buffer.from(parsedAttachment.salt, "base64"),
    secret: Buffer.from(parsedAttachment.secret, "base64"),
  };
};

export const isAttachmentMessage = (contentType?: string) =>
  contentType
    ? contentType.startsWith("xmtp.org/attachment:") ||
      contentType.startsWith("xmtp.org/remoteStaticAttachment:")
    : false;
