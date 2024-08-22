import { translate } from "@i18n";
import {
  backgroundColor,
  textPrimaryColor,
  tertiaryBackgroundColor,
} from "@styles/colors";
import { Image } from "expo-image";
import prettyBytes from "pretty-bytes";
import { useCallback, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
} from "react-native";

import { useAttachmentForMessage } from "../../../utils/attachment";
import { converseEventEmitter } from "../../../utils/events";
import { navigate } from "../../../utils/navigation";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";
import Picto from "../../Picto/Picto";
import { MessageToDisplay } from "../Message/Message";
import MessageTimestamp from "../Message/MessageTimestamp";

type Props = {
  message: MessageToDisplay;
};

export default function AttachmentMessagePreview({ message }: Props) {
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

  const metadataView = <MessageTimestamp message={message} white={showing} />;
  const filesize = prettyBytes(attachment.contentLength);
  const textStyle = [
    styles.text,
    { color: textPrimaryColor(colorScheme), fontSize: 12 },
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
      <View
        style={[
          styles.imagePreview,
          {
            aspectRatio: 1.5,
            backgroundColor: tertiaryBackgroundColor(colorScheme),
          },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  } else if (attachment.error) {
    return (
      <View
        style={[
          styles.imagePreview,
          {
            aspectRatio: 1.5,
            backgroundColor: tertiaryBackgroundColor(colorScheme),
          },
        ]}
      >
        <Text style={textStyle}>
          {translate("attachment_message_error_download")}
        </Text>
      </View>
    );
  } else if (!attachment.mediaURL) {
    // Either unsupported type or too big
    return (
      <View
        style={[
          styles.imagePreview,
          {
            aspectRatio: 1.5,
            backgroundColor: tertiaryBackgroundColor(colorScheme),
          },
        ]}
      >
        <TouchableOpacity onPress={fetch} style={styles.downloadButton}>
          <Picto picto="arrow.down" size={14} color="white" />
          <Text style={styles.downloadText}>{filesize}</Text>
        </TouchableOpacity>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </View>
    );
  } else if (attachment.mediaType === "UNSUPPORTED") {
    // Downloaded but unsupported
    return (
      <View
        style={[
          styles.imagePreview,
          {
            aspectRatio: 1.5,
            backgroundColor: tertiaryBackgroundColor(colorScheme),
          },
        ]}
      >
        <Text style={[textStyle, styles.textUnderline]} onPress={openInWebview}>
          {translate("attachment_message_view_in_browser")}
        </Text>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </View>
    );
  } else {
    // Downloaded and supported
    converseEventEmitter.emit(
      `attachmentMessageProcessed-${attachment.filename}`
    );
    const aspectRatio = attachment.imageSize
      ? attachment.imageSize.width / attachment.imageSize.height
      : undefined;
    return (
      <>
        <Image
          source={{ uri: attachment.mediaURL }}
          contentFit="cover"
          style={[styles.imagePreview, { aspectRatio }]}
        />
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
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
    },
    text: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    textUnderline: {
      textDecorationLine: "underline",
    },
    metadataContainer: {
      position: "absolute",
      bottom: 5,
      right: 10,
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
    sendingIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    downloadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      padding: 10,
      paddingLeft: 16,
      backgroundColor: "black",
      color: "white",
    },
    downloadText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 16,
    },
  });
};
