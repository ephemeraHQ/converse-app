import { InboxId, RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import RNFS from "react-native-fs";
import {
  getXmtpClientForCurrentInboxOrThrow,
  getXmtpClientOrThrow,
} from "@/features/Accounts/accounts.utils";

export const MAX_AUTOMATIC_DOWNLOAD_ATTACHMENT_SIZE = 10000000; // 10MB

export const encryptRemoteAttachmentForCurrentUser = async (args: {
  fileUri: string;
  mimeType: string | undefined;
}) => {
  const { fileUri, mimeType } = args;
  const client = getXmtpClientForCurrentInboxOrThrow({
    caller: "encryptRemoteAttachmentForCurrentUser",
  });
  const encryptedAttachment = await client.encryptAttachment({
    fileUri,
    mimeType,
  });
  return encryptedAttachment;
};

export const fetchAndDecodeRemoteAttachment = async (args: {
  inboxId: InboxId;
  messageId: string;
  remoteAttachmentContent: RemoteAttachmentContent;
}) => {
  const { inboxId, messageId, remoteAttachmentContent } = args;

  const separator = RNFS.TemporaryDirectoryPath.endsWith("/") ? "" : "/";
  const encryptedLocalFileUri =
    `file://${RNFS.TemporaryDirectoryPath}${separator}${messageId}` as `file://${string}`;

  await RNFS.downloadFile({
    fromUrl: remoteAttachmentContent.url,
    toFile: encryptedLocalFileUri,
  }).promise;

  const client = getXmtpClientOrThrow({
    inboxId,
    caller: "fetchAndDecodeRemoteAttachment",
  });

  const decryptedContent = await client.decryptAttachment({
    encryptedLocalFileUri,
    metadata: remoteAttachmentContent,
  });

  return decryptedContent;
};
