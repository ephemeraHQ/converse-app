import {
  Attachment,
  EncryptedEncodedContent,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { Client } from "@xmtp/xmtp-js";
import axios from "axios";
import mime from "mime";
import { useCallback, useEffect, useState } from "react";

import { MessageToDisplay } from "../../components/Chat/ChatMessage";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { getPresignedUriForUpload } from "../api";
import { isImageMimetype } from "../media";
import { sentryTrackMessage } from "../sentry";
import { deserializeRemoteAttachmentMessageContent } from "../xmtpRN/attachments.web";
import { isContentType } from "../xmtpRN/contentTypes";
import { getXmtpClient } from "../xmtpRN/sync";

// On web, we don't have a locally saved attachment, we always need to decode
export const getLocalAttachment = async (messageId: string) => {
  return undefined;
};

const blobCache = new Map<string, string>();

export const getBlobUrl = (messageId: string, attachment: Attachment) => {
  if (!blobCache.get(messageId)) {
    blobCache.set(
      messageId,
      URL.createObjectURL(
        new Blob([Buffer.from(attachment.data)], {
          type: attachment.mimeType,
        })
      )
    );
  }

  return blobCache.get(messageId);
};

const getImageSize = (
  imageUrl: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = imageUrl;
  });
};

export const useAttachmentForMessage = (message: MessageToDisplay) => {
  const currentAccount = useCurrentAccount() as string;
  const [attachment, setAttachment] = useState({
    loading: true,
    error: false,
    mediaType: undefined as undefined | "IMAGE" | "UNSUPPORTED",
    mediaURL: undefined as undefined | string,
    filename: "",
    mimeType: "",
    contentLength: 0,
    imageSize: undefined as undefined | { height: number; width: number },
  });

  const displayAttachment = useCallback(
    async (attachment: Attachment) => {
      const url = getBlobUrl(message.id, attachment) as string;
      const isImage = isImageMimetype(attachment.mimeType);
      let imageSize: { width: number; height: number } | undefined = undefined;

      if (isImage) {
        try {
          imageSize = await getImageSize(url);
        } catch (e) {
          console.log(e);
        }
      }

      setAttachment({
        mediaType:
          isImage && imageSize
            ? "IMAGE"
            : ("UNSUPPORTED" as "IMAGE" | "UNSUPPORTED" | undefined),
        imageSize,
        contentLength: attachment.data.length,
        mediaURL: url,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        loading: false,
        error: false,
      });
    },
    [message.id]
  );

  const fetchAndDecode = useCallback(async () => {
    const remoteAttachment = deserializeRemoteAttachmentMessageContent(
      message.content
    );
    const attachment = (await RemoteAttachmentCodec.load(
      remoteAttachment,
      (await getXmtpClient(currentAccount)) as Client
    )) as Attachment;
    displayAttachment(attachment);
  }, [currentAccount, displayAttachment, message.content]);

  useEffect(() => {
    const go = async () => {
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
          displayAttachment(parsedEncodedContent as Attachment);
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
  }, [displayAttachment, fetchAndDecode, message]);

  return { attachment, fetchAndDecode };
};

export const uploadRemoteAttachment = async (
  account: string,
  attachment: EncryptedEncodedContent & {
    filename: string;
    contentLength: number;
  }
): Promise<RemoteAttachment> => {
  const { url } = await getPresignedUriForUpload(account);
  await axios.put(url, new Blob([attachment.payload]), {
    headers: {
      "content-type": "application/octet-stream",
      "x-amz-acl": "public-read",
    },
  });

  const fileURL = new URL(url);
  const publicURL = fileURL.origin + fileURL.pathname;

  return {
    url: publicURL,
    contentDigest: attachment.digest,
    salt: attachment.salt,
    nonce: attachment.nonce,
    secret: attachment.secret,
    scheme: "https://",
    contentLength: attachment.contentLength,
    filename: attachment.filename,
  };
};
