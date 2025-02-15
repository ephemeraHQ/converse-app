import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import RNFS from "react-native-fs";

export const MAX_AUTOMATIC_DOWNLOAD_ATTACHMENT_SIZE = 10000000; // 10MB

export const encryptRemoteAttachment = async (
  account: string,
  fileUri: string,
  mimeType: string | undefined
) => {
  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });
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

  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  const decryptedContent = await client.decryptAttachment({
    encryptedLocalFileUri,
    metadata: remoteAttachmentContent,
  });

  return decryptedContent;
};
