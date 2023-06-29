import * as Linking from "expo-linking";
import mime from "mime";
import prettyBytes from "pretty-bytes";
import { useCallback, useEffect, useState } from "react";
import {
  ColorSchemeName,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import RNFS from "react-native-fs";

import { textPrimaryColor } from "../../utils/colors";
import { getImageSize, isImageMimetype } from "../../utils/media";
import { getLocalXmtpClient } from "../XmtpState";
import { sendMessageToWebview } from "../XmtpWebview";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

export default function ChatAttachmentBubble({ message }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [attachment, setAttachment] = useState({
    loading: true,
    mediaType: undefined as undefined | "IMAGE" | "UNSUPPORTED",
    mediaURL: undefined as undefined | string,
    filename: "",
    mimeType: "",
    contentLength: 0,
    imageSize: undefined as undefined | { height: number; width: number },
  });

  const fetchAndDecodeAttachment = useCallback(() => {
    setAttachment((a) => ({ ...a, loading: true }));
    sendMessageToWebview(
      "DECODE_ATTACHMENT",
      { serializedRemoteAttachment: message.content },
      async (attachment: any) => {
        const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${message.id}`;
        const attachmentJsonPath = `${messageFolder}/attachment.json`;
        // Create folder
        await RNFS.mkdir(messageFolder, {
          NSURLIsExcludedFromBackupKey: true,
        });
        const attachmentPath = `${messageFolder}/${attachment.filename}`;
        const supportedMediaType = isImageMimetype(attachment.mimeType);
        // Let's cache the file and decoded information
        await RNFS.writeFile(attachmentPath, attachment.data, "base64");
        const imageSize = await getImageSize(`file://${attachmentPath}`);
        await RNFS.writeFile(
          attachmentJsonPath,
          JSON.stringify({
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            imageSize,
          }),
          "utf8"
        );

        setAttachment({
          mediaType: supportedMediaType ? "IMAGE" : "UNSUPPORTED",
          loading: false,
          imageSize,
          contentLength: 0,
          mediaURL: attachmentPath,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
        });
      }
    );
  }, [message.content, message.id]);

  const openInWebview = useCallback(async () => {
    if (!attachment.mediaURL) return;
    Linking.openURL(
      Linking.createURL("/webviewPreview", {
        queryParams: {
          uri: `file://${attachment.mediaURL}`,
        },
      })
    );
  }, [attachment.mediaURL]);

  useEffect(() => {
    const go = async () => {
      const client = await getLocalXmtpClient();
      const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${message.id}`;
      // await RNFS.unlink(messageFolder);
      const attachmentJsonPath = `${messageFolder}/attachment.json`;
      if (!client) return;
      const attachmentExists = await RNFS.exists(attachmentJsonPath);
      if (attachmentExists) {
        try {
          const messageAttachmentData = JSON.parse(
            await RNFS.read(attachmentJsonPath)
          );
          const supportedMediaType = isImageMimetype(
            messageAttachmentData.mimeType
          );
          const attachmentPath = `${messageFolder}/${messageAttachmentData.filename}`;
          const fileExists = await RNFS.exists(attachmentPath);
          if (fileExists) {
            // If we have the file locally let's display
            // it or have a link
            setAttachment({
              mediaType: supportedMediaType ? "IMAGE" : "UNSUPPORTED",
              loading: false,
              mimeType: messageAttachmentData.mimeType,
              imageSize: messageAttachmentData.imageSize,
              mediaURL: attachmentPath,
              contentLength: 0,
              filename: messageAttachmentData.filename,
            });
            return;
          }
        } catch (e) {
          //
        }
      }

      let contentLength = 0;

      // Let's see if we can infer type from filename
      try {
        const parsedEncodedContent = JSON.parse(message.content);
        const parsedType = mime.getType(parsedEncodedContent.filename);
        contentLength = parsedEncodedContent.contentLength;
        setAttachment({
          mediaType:
            parsedType && isImageMimetype(parsedType) ? "IMAGE" : "UNSUPPORTED",
          loading: false,
          mediaURL: undefined,
          imageSize: undefined,
          contentLength: parsedEncodedContent.contentLength,
          mimeType: parsedType || "",
          filename: parsedEncodedContent.filename,
        });
      } catch (e) {
        console.log(e);
      }

      // Last, if media is supported and size is ok, we fetch immediatly
      if (contentLength <= 10000000) {
        fetchAndDecodeAttachment();
      }
    };
    go();
  }, [fetchAndDecodeAttachment, message.content, message.id]);

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
    { color: message.fromMe ? "white" : undefined },
  ];

  if (attachment.loading) {
    return (
      <>
        <Text style={[textStyle, { fontStyle: "italic" }]}>
          {emoji} Downloading {filename.toLowerCase()}
        </Text>
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
            onPress={fetchAndDecodeAttachment}
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
        <TouchableWithoutFeedback onPress={openInWebview}>
          <Image
            source={{ uri: `file://${attachment.mediaURL}` }}
            style={[styles.imagePreview, { aspectRatio }]}
          />
        </TouchableWithoutFeedback>
        <View style={styles.metadataContainer}>{metadataView}</View>
      </>
    );
  }
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
