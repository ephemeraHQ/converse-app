import { DecryptedLocalAttachment } from "@xmtp/react-native-sdk";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import mime from "mime";
import prettyBytes from "pretty-bytes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import { useAccountsStore } from "../../data/store/accountsStore";
import {
  SerializedAttachmentContent,
  getLocalAttachment,
  handleDecryptedRemoteAttachment,
  handleStaticAttachment,
} from "../../utils/attachment";
import {
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import { converseEventEmitter } from "../../utils/events";
import { isImageMimetype } from "../../utils/media";
import { sentryTrackError, sentryTrackMessage } from "../../utils/sentry";
import { fetchAndDecodeRemoteAttachment } from "../../utils/xmtpRN/attachments";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

export default function ChatTransactionReference({ message }: Props) {
  const colorScheme = useColorScheme();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const styles = useStyles();

  const [transaction, setTransaction] = useState({
    // TODO
    loading: true,
    error: false,
    mediaType: undefined as undefined | "IMAGE" | "UNSUPPORTED",
    mediaURL: undefined as undefined | string,
    filename: "",
    mimeType: "",
    contentLength: 0,
    imageSize: undefined as undefined | { height: number; width: number },
  });

  const saveAndDisplayLocalAttachment = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      setTransaction((a) => ({ ...a, loading: true }));
      const result = await handleStaticAttachment(
        message.id,
        attachmentContent
      );

      setTransaction({ ...result, loading: false, error: false });
    },
    // TODO
    [message.id]
  );

  const saveAndDisplayRemoteAttachment = useCallback(
    async (attachmentContent: DecryptedLocalAttachment) => {
      setTransaction((a) => ({ ...a, loading: true }));
      const result = await handleDecryptedRemoteAttachment(
        message.id,
        attachmentContent
      );

      setTransaction({ ...result, loading: false, error: false });
    },
    [message.id]
  );
  const fetchingTransactionRef = useRef(false);

  const fetchAndDecode = useCallback(async () => {
    if (fetchingTransactionRef.current) return;
    fetchingTransactionRef.current = true;
    setTransaction((a) => ({ ...a, loading: true }));
    try {
      const result = await fetchAndDecodeRemoteAttachment(
        currentAccount,
        message
      );
      fetchingTransactionRef.current = false;
      saveAndDisplayRemoteAttachment(result);
    } catch (e) {
      fetchingTransactionRef.current = false;
      sentryTrackError(e, { message });
      setTransaction((a) => ({ ...a, loading: false, error: true }));
    }
  }, [currentAccount, message, saveAndDisplayRemoteAttachment]);

  const saveLocalAttachment = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      if (!attachmentContent.data) {
        sentryTrackMessage("LOCAL_ATTACHMENT_NO_DATA", {
          content: attachmentContent,
        });
        setTransaction((a) => ({ ...a, error: true, loading: false }));
        return;
      }
      saveAndDisplayLocalAttachment(attachmentContent);
    },
    // TODO open block explorer
    [saveAndDisplayLocalAttachment]
  );

  const openInWebview = useCallback(async () => {
    if (
      !transaction.mediaURL ||
      transaction.loading ||
      transaction.error ||
      !transaction.mediaURL
    )
      return;
    Linking.openURL(
      Linking.createURL("/webviewPreview", {
        queryParams: {
          uri: `file://${attachment.mediaURL}`,
        },
      })
    );
  }, [transaction.error, transaction.loading, transaction.mediaURL]);
  const clickedOnAttachmentBubble = useCallback(() => {
    if (transaction.mediaType !== "UNSUPPORTED") {
      openInWebview();
    }
  }, [transaction.mediaType, openInWebview]);

  useEffect(() => {
    const go = async () => {
      const localAttachment = await getLocalAttachment(message.id);
      if (localAttachment) {
        setTransaction({ ...localAttachment, loading: false, error: false });
        return;
      }

      // Either remote or direct attachement (< 1MB)
      const isRemoteAttachment = message.contentType.startsWith(
        "xmtp.org/remoteStaticAttachment:"
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
          setTransaction({
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
      setTransaction((a) => ({ ...a, error: true, loading: false }));
    } else {
      go();
    }
  }, [fetchAndDecode, message, saveLocalAttachment]);

  const showing =
    !transaction.loading &&
    !!transaction.mediaURL &&
    transaction.mediaType !== "UNSUPPORTED";

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );
  const emoji = transaction.mediaType === "IMAGE" ? "📷" : "📎";
  const filesize = prettyBytes(transaction.contentLength);
  const filename =
    transaction.mediaType === "IMAGE"
      ? "Image"
      : transaction.filename || "Attachment";
  const textStyle = [
    styles.text,
    { color: message.fromMe ? "white" : textPrimaryColor(colorScheme) },
  ];

  useEffect(() => {
    converseEventEmitter.on(
      `openAttachmentForMessage-${message.id}`,
      clickedOnAttachmentBubble
    );
    return () => {
      converseEventEmitter.off(
        `openAttachmentForMessage-${message.id}`,
        clickedOnAttachmentBubble
      );
    };
  }, [message.id, clickedOnAttachmentBubble]);

  if (transaction.loading) {
    return (
      <>
        <Text style={textStyle}>
          {emoji}{" "}
          <Text style={{ fontStyle: "italic" }}>
            Downloading {filename.toLowerCase()}
          </Text>
        </Text>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (transaction.error) {
    return (
      <>
        <View style={styles.innerBubble}>
          <Text style={textStyle}>Transaction</Text>
        </View>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (!transaction.mediaURL) {
    // Either unsupported type or too big
    return (
      <>
        <Text style={textStyle}>
          {emoji} {filename} - {filesize}{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={fetchAndDecode}
          >
            download
          </Text>
        </Text>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (transaction.mediaType === "UNSUPPORTED") {
    // Downloaded but unsupported
    return (
      <>
        <Text style={textStyle}>
          {emoji} {filename}{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={openInWebview}
          >
            view
          </Text>
        </Text>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else {
    // Downloaded and supported
    const aspectRatio = transaction.imageSize
      ? transaction.imageSize.width / transaction.imageSize.height
      : undefined;
    return (
      <>
        <Image
          source={{ uri: `file://${transaction.mediaURL}` }}
          contentFit="contain"
          style={[styles.imagePreview, { aspectRatio }]}
        />
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  }
}

// TODO REMOVE
const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    imagePreview: {
      borderRadius: 14,
      width: "100%",
      zIndex: 1,
    },
    text: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    innerBubble: {
      backgroundColor: myMessageInnerBubbleColor(colorScheme),
      borderRadius: 14,
      width: "100%",
      paddingHorizontal: 2,
      paddingVertical: 6,
      marginBottom: 5,
    },
    metadataContainer: {
      position: "absolute",
      bottom: 6,
      right: 12,
      backgroundColor: "rgba(24, 24, 24, 0.5)",
      borderRadius: 18,
      paddingLeft: 1,
      paddingRight: 2,
      zIndex: 2,
      ...Platform.select({
        default: {
          paddingBottom: 1,
          paddingTop: 1,
        },
        android: { paddingBottom: 3, paddingTop: 2 },
      }),
    },
  });
};
