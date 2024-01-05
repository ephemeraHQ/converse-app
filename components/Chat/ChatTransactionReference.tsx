import { Image } from "expo-image";
import mime from "mime";
import prettyBytes from "pretty-bytes";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import { useAccountsStore } from "../../data/store/accountsStore";
import { getLocalAttachment } from "../../utils/attachment";
import {
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import { isImageMimetype } from "../../utils/media";
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
    loading: true,
    error: false,
    id: "", // Concatenation of "[networkid]-[reference]"
    contentType: undefined as
      | undefined
      | "transactionReference"
      | "coinbaseRegular"
      | "coinbaseSponsored",
    createdAt: 0,
    updatedAt: 0,
    namespace: undefined as undefined | string,
    networkId: "",
    reference: "",
    metadata: undefined as undefined | object,
    status: undefined as undefined | "PENDING" | "FAILURE" | "SUCCESS",
    sponsored: true, // by converse
    blockExplorerURL: undefined as undefined | string,
    events: undefined as undefined | [],
  });

  // TODO saveAndDisplayTransaction
  // TODO fetchTransactionDetails
  // TODO openInWebview

  const fetchingTransactionRef = useRef(false);

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
  }, [message]);

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
