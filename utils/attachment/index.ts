import {
  DecryptedLocalAttachment,
  EncryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import mime from "mime";
import { useCallback, useEffect, useRef, useState } from "react";
import RNFS from "react-native-fs";
import RNFetchBlob from "rn-fetch-blob";

import { MessageToDisplay } from "../../components/Chat/ChatMessage";
import { useCurrentAccount } from "../../data/store/accountsStore";
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
      console.log(e);
    }
  }
};

export const uploadRemoteAttachment = async (
  account: string,
  attachment: EncryptedLocalAttachment
): Promise<RemoteAttachmentContent> => {
  const { url } = await getPresignedUriForUpload(account);
  await RNFetchBlob.fetch(
    "PUT",
    url,
    {
      "content-type": "application/octet-stream",
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(attachment.encryptedLocalFileUri.replace("file:///", "/"))
  );

  const fileURL = new URL(url);
  const publicURL = fileURL.origin + fileURL.pathname;

  return {
    scheme: "https://",
    url: publicURL,
    ...attachment.metadata,
  };
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
  const [attachment, setAttachment] = useState(DEFAULT_ATTACHMENT);

  // Resetting state because components are reclycled!
  if (message.id !== messageId.current) {
    messageId.current = message.id;
    setAttachment(DEFAULT_ATTACHMENT);
  }

  const saveAndDisplayLocalAttachment = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      setAttachment((a) => ({ ...a, loading: true }));
      const result = await handleStaticAttachment(
        message.id,
        attachmentContent
      );

      setAttachment({ ...result, loading: false, error: false });
    },
    [message.id]
  );

  const saveAndDisplayRemoteAttachment = useCallback(
    async (attachmentContent: DecryptedLocalAttachment) => {
      setAttachment((a) => ({ ...a, loading: true }));
      const result = await handleDecryptedRemoteAttachment(
        message.id,
        attachmentContent
      );

      setAttachment({ ...result, loading: false, error: false });
    },
    [message.id]
  );
  const fetchingAttachment = useRef(false);

  const fetchAndDecode = useCallback(async () => {
    if (fetchingAttachment.current) return;
    fetchingAttachment.current = true;
    setAttachment((a) => ({ ...a, loading: true }));
    try {
      const result = await fetchAndDecodeRemoteAttachment(
        currentAccount,
        message
      );
      fetchingAttachment.current = false;
      saveAndDisplayRemoteAttachment(result);
    } catch (e) {
      fetchingAttachment.current = false;
      sentryTrackError(e, { message });
      setAttachment((a) => ({ ...a, loading: false, error: true }));
    }
  }, [currentAccount, message, saveAndDisplayRemoteAttachment]);

  const saveLocalAttachment = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      if (!attachmentContent.data) {
        sentryTrackMessage("LOCAL_ATTACHMENT_NO_DATA", {
          content: attachmentContent,
        });
        setAttachment((a) => ({ ...a, error: true, loading: false }));
        return;
      }
      saveAndDisplayLocalAttachment(attachmentContent);
    },
    [saveAndDisplayLocalAttachment]
  );

  useEffect(() => {
    const go = async () => {
      const localAttachment = await getLocalAttachment(message.id);
      if (localAttachment) {
        setAttachment({ ...localAttachment, loading: false, error: false });
        return;
      }

      // Either remote or direct attachement (< 1MB)
      const isRemoteAttachment = isContentType(
        "remoteAttachment",
        message.contentType
      );

      let contentLength = 0;

      // Let's see if we can infer type from filename
      try {
        const parsedEncodedContent = JSON.parse(message.content);
        const parsedType = isRemoteAttachment
          ? mime.getType(parsedEncodedContent.filename)
          : parsedEncodedContent.mimeType;
        if (isRemoteAttachment) {
          contentLength = parsedEncodedContent.contentLength;
          setAttachment({
            mediaType:
              parsedType && isImageMimetype(parsedType)
                ? "IMAGE"
                : "UNSUPPORTED",
            loading: contentLength <= 10000000,
            mediaURL: undefined,
            imageSize: undefined,
            contentLength: parsedEncodedContent.contentLength,
            mimeType: parsedType || "",
            filename: parsedEncodedContent.filename,
            error: false,
          });
        } else {
          saveLocalAttachment(parsedEncodedContent);
        }
      } catch (e) {
        console.log(e);
      }

      // Last, if media is local or if remote but supported and size is ok, we fetch immediatly
      if (isRemoteAttachment && contentLength <= 10000000) {
        fetchAndDecode();
      }
    };
    if (!message.content) {
      sentryTrackMessage("ATTACHMENT_NO_CONTENT", { message });
      setAttachment((a) => ({ ...a, error: true, loading: false }));
    } else {
      go();
    }
  }, [fetchAndDecode, message, saveLocalAttachment]);

  return { attachment, fetch: fetchAndDecode };
};
