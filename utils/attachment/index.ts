import {
  useCurrentAccount,
  useChatStore,
} from "@features/accounts/accounts.store";
import logger from "@utils/logger";
import {
  DecryptedLocalAttachment,
  EncryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import mime from "mime";
import { useCallback, useEffect, useRef } from "react";
import RNFS from "react-native-fs";
import RNFetchBlob from "rn-fetch-blob";

import { MessageToDisplay } from "../../components/Chat/Message/Message";
import { ConverseMessageMetadata } from "../../data/db/entities/messageEntity";
import { saveMessageMetadata } from "../../data/helpers/messages";
import { getPresignedUriForUpload } from "../api";
import { moveFileAndReplace } from "../fileSystem";
import { getImageSize, isImageMimetype } from "../media";
import { sentryTrackError, sentryTrackMessage } from "../sentry";
import { fetchAndDecodeRemoteAttachment } from "../xmtpRN/attachments";
import { isContentType } from "../xmtpRN/contentTypes";

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

export const handleStaticAttachment = async (
  messageId: string,
  staticAttachment: SerializedAttachmentContent
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${staticAttachment.filename}`;
  // Let's cache the file and decoded information
  await RNFS.writeFile(attachmentPath, staticAttachment.data, "base64");
  return handleAttachment(
    messageId,
    staticAttachment.filename,
    staticAttachment.mimeType
  );
};

export const handleDecryptedRemoteAttachment = async (
  messageId: string,
  localAttachment: DecryptedLocalAttachment
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  let filename =
    localAttachment.filename || localAttachment.fileUri.split("/").slice(-1)[0];
  // Add extension for the mimetype if necessary
  if (localAttachment.mimeType) {
    const extension = mime.getExtension(localAttachment.mimeType);
    if (extension && !filename.toLowerCase().endsWith(`.${extension}`)) {
      filename = `${filename}.${extension}`;
    }
  }
  const attachmentPath = `${messageFolder}/${filename}`;
  let fileUri = localAttachment.fileUri;
  if (fileUri.startsWith("file:///")) {
    fileUri = fileUri.slice(7);
  } else if (fileUri.startsWith("file://")) {
    fileUri = fileUri.slice(6);
  } else if (fileUri.startsWith("file:/")) {
    fileUri = fileUri.slice(5);
  }

  // Let's cache the file and decoded information
  await moveFileAndReplace(fileUri, attachmentPath);
  return handleAttachment(messageId, filename, localAttachment.mimeType);
};

const handleAttachment = async (
  messageId: string,
  filename: string,
  mimeType?: string
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  const attachmentPath = `${messageFolder}/${filename}`;
  const attachmentJsonPath = `${messageFolder}/attachment.json`;
  const isImage = isImageMimetype(mimeType);
  const imageSize = isImage
    ? await getImageSize(`file://${attachmentPath}`)
    : undefined;
  await RNFS.writeFile(
    attachmentJsonPath,
    JSON.stringify({
      filename,
      mimeType,
      imageSize,
    }),
    "utf8"
  );

  return {
    mediaType: isImage
      ? "IMAGE"
      : ("UNSUPPORTED" as "IMAGE" | "UNSUPPORTED" | undefined),
    imageSize,
    contentLength: 0,
    mediaURL: `file://${attachmentPath}`,
    filename,
    mimeType: mimeType || "",
  };
};

export const getLocalAttachment = async (messageId: string) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  const attachmentJsonPath = `${messageFolder}/attachment.json`;
  const attachmentExists = await RNFS.exists(attachmentJsonPath);
  if (attachmentExists) {
    try {
      const attachmentJsonContent = await RNFS.readFile(
        attachmentJsonPath,
        "utf8"
      );
      const messageAttachmentData = JSON.parse(attachmentJsonContent);
      const supportedMediaType = isImageMimetype(
        messageAttachmentData.mimeType
      );
      const attachmentPath = `${messageFolder}/${messageAttachmentData.filename}`;
      const fileExists = await RNFS.exists(attachmentPath);
      if (fileExists) {
        // If we have the file locally let's display
        // it or have a link
        return {
          mediaType: (supportedMediaType ? "IMAGE" : "UNSUPPORTED") as
            | "IMAGE"
            | "UNSUPPORTED"
            | undefined,
          mimeType: messageAttachmentData.mimeType,
          imageSize: messageAttachmentData.imageSize,
          mediaURL: `file://${attachmentPath}`,
          contentLength: 0,
          filename: messageAttachmentData.filename,
        };
      }
    } catch (e) {
      logger.warn(e);
    }
  }
};

export const uploadRemoteAttachment = async (
  account: string,
  attachment: EncryptedLocalAttachment
): Promise<RemoteAttachmentContent> => {
  const publicURL = await uploadFile({
    account,
    filePath: attachment.encryptedLocalFileUri,
  });

  return {
    scheme: "https://",
    url: publicURL,
    ...attachment.metadata,
  };
};

export const uploadFile = async ({
  account,
  filePath,
  contentType,
}: {
  account?: string | undefined;
  filePath?: string | undefined;
  blob?: Blob | undefined;
  contentType?: string | undefined;
}) => {
  if (!filePath) {
    throw new Error("filePath needed to upload file from mobile");
  }
  const { url } = await getPresignedUriForUpload(account, contentType);
  await RNFetchBlob.fetch(
    "PUT",
    url,
    {
      "content-type": contentType || "application/octet-stream",
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(filePath.replace("file:///", "/"))
  );
  const fileURL = new URL(url);
  const publicURL = fileURL.origin + fileURL.pathname;
  return publicURL;
};

export const saveAttachmentForPendingMessage = async (
  pendingMessageId: string,
  filePath: string,
  fileName: string,
  mimeType: string | null
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${pendingMessageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${fileName}`;
  await moveFileAndReplace(filePath, attachmentPath);
  await handleAttachment(pendingMessageId, fileName, mimeType || undefined);
};

const DEFAULT_ATTACHMENT = {
  loading: true,
  error: false,
  mediaType: undefined as undefined | "IMAGE" | "UNSUPPORTED",
  mediaURL: undefined as undefined | string,
  filename: "",
  mimeType: "",
  contentLength: 0,
  imageSize: undefined as undefined | { height: number; width: number },
};

export const useAttachmentForMessage = (message: MessageToDisplay) => {
  const currentAccount = useCurrentAccount() as string;
  const messageId = useRef(message.id);
  const [messageAttachment, setMessageAttachment] = useChatStore((state) => [
    state.messageAttachments[message.id] || DEFAULT_ATTACHMENT,
    state.setMessageAttachment,
  ]);

  useEffect(() => {
    // Reset state if message ID changes (component recycling)
    if (message.id !== messageId.current) {
      messageId.current = message.id;
      setMessageAttachment(message.id, DEFAULT_ATTACHMENT);
    }
  }, [message.id, message.topic, setMessageAttachment]);

  const saveAndDisplayLocalAttachment = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      setMessageAttachment(message.id, {
        ...DEFAULT_ATTACHMENT,
        loading: true,
      });
      try {
        const result = await handleStaticAttachment(
          message.id,
          attachmentContent
        );
        setMessageAttachment(message.id, {
          ...result,
          loading: false,
          error: false,
        });
      } catch (error) {
        logger.error(error, { context: "Error handling static attachment" });
        setMessageAttachment(message.id, {
          ...DEFAULT_ATTACHMENT,
          loading: false,
          error: true,
        });
      }
    },
    [message.id, setMessageAttachment]
  );

  const saveAndDisplayRemoteAttachment = useCallback(
    async (attachmentContent: DecryptedLocalAttachment) => {
      setMessageAttachment(message.id, {
        ...DEFAULT_ATTACHMENT,
        loading: true,
      });
      try {
        const result = await handleDecryptedRemoteAttachment(
          message.id,
          attachmentContent
        );
        setMessageAttachment(message.id, {
          ...result,
          loading: false,
          error: false,
        });
      } catch (error) {
        logger.error(error, { context: "Error handling remote attachment" });
        setMessageAttachment(message.id, {
          ...DEFAULT_ATTACHMENT,
          loading: false,
          error: true,
        });
      }
    },
    [message.id, setMessageAttachment]
  );

  const fetchingAttachment = useRef(false);

  const fetchAndDecode = useCallback(async () => {
    if (fetchingAttachment.current) return;
    fetchingAttachment.current = true;
    setMessageAttachment(message.id, { ...DEFAULT_ATTACHMENT, loading: true });
    try {
      const result = await fetchAndDecodeRemoteAttachment(
        currentAccount,
        message
      );
      await saveAndDisplayRemoteAttachment(result);
    } catch (e) {
      sentryTrackError(e, { message });
      setMessageAttachment(message.id, {
        ...DEFAULT_ATTACHMENT,
        loading: false,
        error: true,
      });
    } finally {
      fetchingAttachment.current = false;
    }
  }, [
    currentAccount,
    message,
    saveAndDisplayRemoteAttachment,
    setMessageAttachment,
  ]);

  const fetchAttachment = useCallback(async () => {
    if (!message.content) {
      sentryTrackMessage("ATTACHMENT_NO_CONTENT", { message });
      setMessageAttachment(message.id, {
        ...DEFAULT_ATTACHMENT,
        loading: false,
        error: true,
      });
      return;
    }

    const localAttachment = await getLocalAttachment(message.id);
    if (localAttachment) {
      setMessageAttachment(message.id, {
        ...localAttachment,
        loading: false,
        error: false,
      });
      return;
    }

    const isRemoteAttachment = isContentType(
      "remoteAttachment",
      message.contentType
    );

    try {
      const parsedEncodedContent = JSON.parse(message.content);
      const parsedType = isRemoteAttachment
        ? mime.getType(parsedEncodedContent.filename)
        : parsedEncodedContent.mimeType;

      if (isRemoteAttachment) {
        const contentLength = parsedEncodedContent.contentLength;
        setMessageAttachment(message.id, {
          mediaType:
            parsedType && isImageMimetype(parsedType) ? "IMAGE" : "UNSUPPORTED",
          loading: contentLength <= 10000000,
          mediaURL: undefined,
          imageSize: undefined,
          contentLength,
          mimeType: parsedType || "",
          filename: parsedEncodedContent.filename,
          error: false,
        });

        if (contentLength <= 10000000) {
          fetchAndDecode();
        }
      } else {
        await saveAndDisplayLocalAttachment(parsedEncodedContent);
      }
    } catch (e) {
      logger.error(e, { context: "Error parsing message content" });
      setMessageAttachment(message.id, {
        ...DEFAULT_ATTACHMENT,
        loading: false,
        error: true,
      });
    }
  }, [
    message,
    fetchAndDecode,
    saveAndDisplayLocalAttachment,
    setMessageAttachment,
  ]);

  useEffect(() => {
    fetchAttachment();
  }, [fetchAttachment]);

  useEffect(() => {
    if (messageAttachment && messageAttachment.imageSize) {
      const messageMetadataToSave: ConverseMessageMetadata = {
        attachment: {
          size: messageAttachment.imageSize,
        },
      };
      saveMessageMetadata(currentAccount, message, messageMetadataToSave);
    }
  }, [messageAttachment, currentAccount, message]);

  return { attachment: messageAttachment, fetch: fetchAndDecode };
};
