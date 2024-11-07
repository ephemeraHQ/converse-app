import { MessageToDisplay } from "@components/Chat/Message/Message";
import { saveMessageMetadata } from "@data/helpers/messages";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useCallback, useEffect, useRef } from "react";

import logger from "@utils/logger";
import { DecryptedLocalAttachment } from "@xmtp/react-native-sdk";
import { fetchAndDecodeRemoteAttachment } from "@utils/xmtpRN/attachments";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { isContentType } from "@utils/xmtpRN/contentTypes";
import mime from "mime";
import { isImageMimetype } from "@utils/media";
import { ConverseMessageMetadata } from "@data/db/entities/messageEntity";
import { SerializedAttachmentContent } from "./types";
import { handleStaticAttachment } from "./handleStaticAttachment";
import { handleDecryptedRemoteAttachment } from "./handleDecryptedRemoteAttachment";
import { getLocalAttachment } from "./getLocalAttachment";

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
