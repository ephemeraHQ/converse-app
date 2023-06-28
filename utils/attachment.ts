import { RemoteAttachment } from "xmtp-content-type-remote-attachment";

export type SerializedAttachmentContent = {
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
  serializedAttachment: string
): RemoteAttachment => {
  const parsedAttachment: SerializedAttachmentContent =
    JSON.parse(serializedAttachment);
  return {
    ...parsedAttachment,
    nonce: Buffer.from(parsedAttachment.nonce, "base64"),
    salt: Buffer.from(parsedAttachment.salt, "base64"),
    secret: Buffer.from(parsedAttachment.secret, "base64"),
  };
};
