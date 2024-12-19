import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import RNFS from "react-native-fs";
import { ConverseXmtpClientType } from "./client.types";
import { getXmtpClient } from "./sync";

export const MAX_AUTOMATIC_DOWNLOAD_ATTACHMENT_SIZE = 10000000; // 10MB

export const encryptRemoteAttachment = async (
  account: string,
  fileUri: string,
  mimeType: string | undefined
) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  const encryptedAttachment = await client.encryptAttachment({
    fileUri,
    mimeType,
  });
  return encryptedAttachment;
};

export const fetchAndDecodeRemoteAttachment = async (args: {
  account: string;
  messageId: string;
  remoteAttachmentContent: RemoteAttachmentContent;
}) => {
  const { account, messageId, remoteAttachmentContent } = args;

  const separator = RNFS.TemporaryDirectoryPath.endsWith("/") ? "" : "/";
  const encryptedLocalFileUri =
    `file://${RNFS.TemporaryDirectoryPath}${separator}${messageId}` as `file://${string}`;

  await RNFS.downloadFile({
    fromUrl: remoteAttachmentContent.url,
    toFile: encryptedLocalFileUri,
  }).promise;

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const decryptedContent = await client.decryptAttachment({
    encryptedLocalFileUri,
    metadata: remoteAttachmentContent,
  });

  return decryptedContent;
};
