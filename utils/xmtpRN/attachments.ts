import {
  DecryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import RNFS from "react-native-fs";

import { XmtpMessage } from "../../data/store/chatStore";
import { getXmtpClient } from "./client";

export const encryptRemoteAttachment = async (
  account: string,
  fileUri: string,
  mimeType?: string
) => {
  const client = await getXmtpClient(account);
  const encryptedAttachment = await client.encryptAttachment({
    fileUri,
    mimeType,
  });
  return encryptedAttachment;
};

export const fetchAndDecodeRemoteAttachment = async (
  account: string,
  message: XmtpMessage
): Promise<DecryptedLocalAttachment> => {
  const remoteAttachment = deserializeRemoteAttachmentMessageContent(
    message.content
  );
  // Let's download the encrypted file
  const separator = RNFS.TemporaryDirectoryPath.endsWith("/") ? "" : "/";
  const encryptedLocalFileUri =
    `file://${RNFS.TemporaryDirectoryPath}${separator}${message.id}` as `file://${string}`;
  await RNFS.downloadFile({
    fromUrl: remoteAttachment.url,
    toFile: encryptedLocalFileUri,
  }).promise;
  const client = await getXmtpClient(account);
  const decryptedContent = await client.decryptAttachment({
    encryptedLocalFileUri,
    metadata: remoteAttachment,
  });
  return decryptedContent;
};

export const serializeRemoteAttachmentMessageContent = (
  content: RemoteAttachmentContent
) => {
  const contentLength = content.contentLength
    ? parseInt(content.contentLength, 10)
    : undefined;
  return JSON.stringify({
    ...content,
    contentLength,
    salt: Buffer.from(content.salt, "hex").toString("base64"),
    nonce: Buffer.from(content.nonce, "hex").toString("base64"),
    secret: Buffer.from(content.secret, "hex").toString("base64"),
  });
};

export const deserializeRemoteAttachmentMessageContent = (
  messageContent: string
) => {
  const parsedContent = JSON.parse(messageContent);
  return {
    ...parsedContent,
    contentLength: `${parsedContent.contentLength}`,
    salt: Buffer.from(parsedContent.salt, "base64").toString("hex"),
    nonce: Buffer.from(parsedContent.nonce, "base64").toString("hex"),
    secret: Buffer.from(parsedContent.secret, "base64").toString("hex"),
  } as RemoteAttachmentContent;
};
