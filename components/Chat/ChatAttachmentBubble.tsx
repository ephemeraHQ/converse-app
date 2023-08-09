import * as Linking from "expo-linking";
import mime from "mime";
import prettyBytes from "pretty-bytes";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import {
  SerializedAttachmentContent,
  getLocalAttachment,
  handleAttachmentContent,
} from "../../utils/attachment";
import { textPrimaryColor } from "../../utils/colors";
import { converseEventEmitter } from "../../utils/events";
import { isImageMimetype } from "../../utils/media";
import { sentryTrackMessage } from "../../utils/sentry";
import { sendMessageToWebview } from "../XmtpWebview";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

export default function ChatAttachmentBubble({ message }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
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

  const saveAndDisplay = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      setAttachment((a) => ({ ...a, loading: true }));
      const result = await handleAttachmentContent(
        message.id,
        attachmentContent
      );

      setAttachment({ ...result, loading: false, error: false });
    },
    [message.id]
  );

  const fetchAndDecodeRemoteAttachment = useCallback(() => {
    setAttachment((a) => ({ ...a, loading: true }));
    sendMessageToWebview(
      "DECODE_ATTACHMENT",
      { serializedRemoteAttachment: message.content },
      async (attachmentResult: any) => {
        if (attachmentResult.status !== "SUCCESS" || !attachmentResult.data) {
          sentryTrackMessage("CANT_DECODE_ATTACHMENT", {
            content: message.content,
            error: attachmentResult,
          });
          setAttachment((a) => ({ ...a, error: true, loading: false }));
          return;
        }
        saveAndDisplay(attachmentResult);
      }
    );
  }, [message.content, saveAndDisplay]);

  const saveLocalAttachment = useCallback(
    async (attachmentContent: SerializedAttachmentContent) => {
      if (!attachmentContent.data) {
        sentryTrackMessage("LOCAL_ATTACHMENT_NO_DATA", {
          content: attachmentContent,
        });
        setAttachment((a) => ({ ...a, error: true, loading: false }));
        return;
      }
      saveAndDisplay(attachmentContent);
    },
    [saveAndDisplay]
  );

  const openInWebview = useCallback(async () => {
    if (
      !attachment.mediaURL ||
      attachment.loading ||
      attachment.error ||
      !attachment.mediaURL
    )
      return;
    Linking.openURL(
      Linking.createURL("/webviewPreview", {
        queryParams: {
          uri: `file://${attachment.mediaURL}`,
        },
      })
    );
  }, [attachment.error, attachment.loading, attachment.mediaURL]);
  const clickedOnAttachmentBubble = useCallback(() => {
    if (attachment.mediaType !== "UNSUPPORTED") {
      openInWebview();
    }
  }, [attachment.mediaType, openInWebview]);

  useEffect(() => {
    const go = async () => {
      const localAttachment = await getLocalAttachment(message.id);
      if (localAttachment) {
        setAttachment({ ...localAttachment, loading: false, error: false });
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
          setAttachment({
            mediaType:
              parsedType && isImageMimetype(parsedType)
                ? "IMAGE"
                : "UNSUPPORTED",
            loading: false,
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
        fetchAndDecodeRemoteAttachment();
      }
    };
    if (!message.content) {
      sentryTrackMessage("ATTACHMENT_NO_CONTENT", { message });
      setAttachment((a) => ({ ...a, error: true, loading: false }));
    } else {
      go();
    }
  }, [fetchAndDecodeRemoteAttachment, message, saveLocalAttachment]);

  const showing =
    !attachment.loading &&
    !!attachment.mediaURL &&
    attachment.mediaType !== "UNSUPPORTED";

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );
  const emoji = attachment.mediaType === "IMAGE" ? "📷" : "📎";
  const filesize = prettyBytes(attachment.contentLength);
  const filename =
    attachment.mediaType === "IMAGE"
      ? "Image"
      : attachment.filename || "Attachment";
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

  if (attachment.loading) {
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
  } else if (attachment.error) {
    return (
      <>
        <Text style={textStyle}>ℹ️ Couldn’t download attachment</Text>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (!attachment.mediaURL) {
    // Either unsupported type or too big
    return (
      <>
        <Text style={textStyle}>
          {emoji} {filename} - {filesize}{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={fetchAndDecodeRemoteAttachment}
          >
            download
          </Text>
        </Text>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (attachment.mediaType === "UNSUPPORTED") {
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
    const aspectRatio = attachment.imageSize
      ? attachment.imageSize.width / attachment.imageSize.height
      : undefined;
    return (
      <>
        <Image
          source={{ uri: `file://${attachment.mediaURL}` }}
          style={[styles.imagePreview, { aspectRatio }]}
        />
        <View style={styles.metadataContainer}>{metadataView}</View>
      </>
    );
  }
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    imagePreview: {
      borderRadius: 18,
      width: "100%",
      resizeMode: "contain",
      zIndex: 1,
    },
    text: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
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
