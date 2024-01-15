import { Image } from "expo-image";
import prettyBytes from "pretty-bytes";
import { useCallback, useEffect } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import { useAttachmentForMessage } from "../../utils/attachment";
import { textPrimaryColor } from "../../utils/colors";
import { converseEventEmitter } from "../../utils/events";
import { navigate } from "../../utils/navigation";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

export default function ChatAttachmentBubble({ message }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const { attachment, fetch } = useAttachmentForMessage(message);

  const openInWebview = useCallback(async () => {
    if (
      !attachment.mediaURL ||
      attachment.loading ||
      attachment.error ||
      !attachment.mediaURL
    )
      return;
    navigate("WebviewPreview", { uri: attachment.mediaURL });
  }, [attachment.error, attachment.loading, attachment.mediaURL]);
  const clickedOnAttachmentBubble = useCallback(() => {
    if (attachment.mediaType !== "UNSUPPORTED") {
      openInWebview();
    }
  }, [attachment.mediaType, openInWebview]);

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
          <Text style={{ textDecorationLine: "underline" }} onPress={fetch}>
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
          source={{ uri: attachment.mediaURL }}
          contentFit="contain"
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
      borderRadius: 14,
      width: "100%",
      zIndex: 1,
      minWidth: Platform.OS === "web" ? 250 : undefined,
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
