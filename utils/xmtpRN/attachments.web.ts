import { RemoteAttachment } from "@xmtp/content-type-remote-attachment";

export const serializeRemoteAttachmentMessageContent = (
  content: RemoteAttachment
) => {
  return JSON.stringify({
    ...content,
    salt: Buffer.from(content.salt).toString("base64"),
    nonce: Buffer.from(content.nonce).toString("base64"),
    secret: Buffer.from(content.secret).toString("base64"),
  });
};

export const deserializeRemoteAttachmentMessageContent = (
  messageContent: string
) => {
  const parsedContent = JSON.parse(messageContent);
  return {
    ...parsedContent,
    salt: Buffer.from(parsedContent.salt, "base64"),
    nonce: Buffer.from(parsedContent.nonce, "base64"),
    secret: Buffer.from(parsedContent.secret, "base64"),
  } as RemoteAttachment;
};
