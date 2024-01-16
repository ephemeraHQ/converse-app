import {
  Attachment,
  AttachmentCodec,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import axios from "axios";
import uuid from "react-native-uuid";

export const encryptRemoteAttachment = async (
  account: string,
  fileUri: string,
  mimeType?: string
) => {
  const response = await axios.get(fileUri, { responseType: "arraybuffer" });
  const data = new Uint8Array(response.data);
  const attachment = {
    filename: fileUri.split("/").pop() || `${uuid.v4().toString()}`,
    mimeType: mimeType || "application/octet-stream",
    data,
  } as Attachment;
  const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(
    attachment,
    new AttachmentCodec()
  );
  return {
    ...encryptedEncoded,
    filename: attachment.filename,
    contentLength: attachment.data.byteLength,
  };
};

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
