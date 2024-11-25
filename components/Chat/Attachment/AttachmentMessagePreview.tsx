import { translate } from "@i18n";
import { Image } from "expo-image";
import prettyBytes from "pretty-bytes";
import { memo } from "react";
import { ActivityIndicator } from "react-native";

import { getCurrentAccount } from "@data/store/accountsStore";
import { Icon } from "@design-system/Icon/Icon";
import { Text } from "@design-system/Text";
import { IVStackProps, VStack } from "@design-system/VStack";
import { PressableScale } from "@design-system/pressable-scale";
import { useQuery } from "@tanstack/react-query";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalAttachmentForMessageId } from "@utils/attachment/getLocalAttachment";
import { handleDecryptedLocalAttachment } from "@utils/attachment/handleDecryptedLocalAttachment";
import {
  MAX_SMALL_ATTACHMENT_SIZE,
  fetchAndDecodeRemoteAttachment,
} from "@utils/xmtpRN/attachments";
import {
  DecodedMessage,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";

type Props = {
  message: DecodedMessage<[RemoteAttachmentCodec]>;
};

export function RemoteAttachmentMessagePreview({ message }: Props) {
  const { theme } = useAppTheme();

  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <RemoteAttachmentPreview
      messageId={message.id}
      remoteMessageContent={content}
    />
  );
}

const RemoteAttachmentPreview = memo(function RemoteAttachmentPreview(props: {
  messageId: string;
  remoteMessageContent: RemoteAttachmentContent;
}) {
  const { messageId, remoteMessageContent } = props;

  const { theme } = useAppTheme();

  const {
    data: attachment,
    isLoading: attachmentLoading,
    error: attachmentError,
    refetch: refetchAttachment,
  } = useQuery({
    queryKey: ["attachment", messageId],
    queryFn: () => fetchAttachment(messageId, remoteMessageContent),
  });

  console.log("attachment:", attachment);

  if (!attachment && attachmentLoading) {
    return (
      <AttachmentPreviewContainer>
        <ActivityIndicator color={theme.colors.text.inverted.primary} />
      </AttachmentPreviewContainer>
    );
  }

  if (attachmentError || !attachment) {
    return (
      <AttachmentPreviewContainer>
        <Text>{translate("attachment_message_error_download")}</Text>
      </AttachmentPreviewContainer>
    );
  }

  // const openInWebview = useCallback(async () => {
  //   if (
  //     !attachment.mediaURL ||
  //     attachment.loading ||
  //     attachment.error ||
  //     !attachment.mediaURL
  //   )
  //     return;
  //   navigate("WebviewPreview", { uri: attachment.mediaURL });
  // }, [attachment.error, attachment.loading, attachment.mediaURL]);

  // const clickedOnAttachmentBubble = useCallback(() => {
  //   if (attachment.mediaType !== "UNSUPPORTED") {
  //     openInWebview();
  //   }
  // }, [attachment.mediaType, openInWebview]);

  // const showing =
  //   !attachment.loading &&
  //   !!attachment.mediaURL &&
  //   attachment.mediaType !== "UNSUPPORTED";

  // useEffect(() => {
  //   converseEventEmitter.on(
  //     `openAttachmentForMessage-${message.id}`,
  //     clickedOnAttachmentBubble
  //   );
  //   return () => {
  //     converseEventEmitter.off(
  //       `openAttachmentForMessage-${message.id}`,
  //       clickedOnAttachmentBubble
  //     );
  //   };
  // }, [message.id, clickedOnAttachmentBubble]);

  // const metadataView = <MessageTimestamp message={message} white={showing} />;

  if (!attachment.mediaURL) {
    return (
      <PressableScale onPress={() => refetchAttachment()}>
        <AttachmentPreviewContainer>
          <Icon icon="arrow.down" size={14} color="white" />
          <Text inverted weight="bold">
            {prettyBytes(attachment.contentLength)}
          </Text>
        </AttachmentPreviewContainer>
      </PressableScale>
    );
  }

  if (attachment.mediaType === "UNSUPPORTED") {
    return (
      <PressableScale
        onPress={() => {
          // openInWebview
        }}
      >
        <AttachmentPreviewContainer>
          <Text
            style={{
              textDecorationLine: "underline",
            }}
          >
            {translate("attachment_message_view_in_browser")}
          </Text>
        </AttachmentPreviewContainer>
      </PressableScale>
    );
  }

  const aspectRatio = attachment.imageSize
    ? attachment.imageSize.width / attachment.imageSize.height
    : undefined;

  console.log("aspectRatio:", aspectRatio);

  return (
    <AttachmentPreviewContainer
      style={{
        aspectRatio,
      }}
    >
      <Image
        source={{ uri: attachment.mediaURL }}
        contentFit="cover"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </AttachmentPreviewContainer>
  );
});

const AttachmentPreviewContainer = memo(function AttachmentPreviewContainer(
  props: IVStackProps
) {
  const { style, ...rest } = props;

  const { theme } = useAppTheme();

  return (
    <VStack
      style={[
        {
          overflow: "hidden",
          borderRadius: theme.borderRadius.sm,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.fill.tertiary,
          aspectRatio: 1.5, // Default aspect ratio for attachments
        },
        style,
      ]}
      {...rest}
    />
  );
});

// const DEFAULT_ATTACHMENT = {
//   loading: true,
//   error: false,
//   mediaType: undefined as undefined | "IMAGE" | "UNSUPPORTED",
//   mediaURL: undefined as undefined | string,
//   filename: "",
//   mimeType: "",
//   contentLength: 0,
//   imageSize: undefined as undefined | { height: number; width: number },
// };

// export const useAttachmentForMessage = (
//   message: DecodedMessage<[RemoteAttachmentCodec]>
// ) => {
//   const currentAccount = useCurrentAccount()!;

//   // const messageId = useRef(message.id);

//   // const [messageAttachment, setMessageAttachment] = useChatStore((state) => [
//   //   state.messageAttachments[message.id] || DEFAULT_ATTACHMENT,
//   //   state.setMessageAttachment,
//   // ]);

//   const { data: attachmentData, refetch: refetchAttachment } = useQuery({
//     queryKey: ["attachment", message.id],
//     queryFn: () => fetchAttachment(message),
//   });

//   return { attachment: attachmentData, fetch: refetchAttachment };
// };

// async function saveAndDisplayLocalAttachment(
//   messageId: string,
//   attachmentContent: SerializedAttachmentContent
// ) {
//   // setMessageAttachment(messageId, {
//   //     ...DEFAULT_ATTACHMENT,
//   //     loading: true,
//   //   });
//   try {
//     const result = await handleStaticAttachment(message.id, attachmentContent);
//     // setMessageAttachment(message.id, {
//     //   ...result,
//     //   loading: false,
//     //   error: false,
//     // });
//   } catch (error) {
//     logger.error(error, { context: "Error handling static attachment" });
//     // setMessageAttachment(message.id, {
//     //   ...DEFAULT_ATTACHMENT,
//     //   loading: false,
//     //   error: true,
//     // });
//   }
// }

async function fetchAttachment(
  messageId: string,
  content: RemoteAttachmentContent
) {
  const localAttachment = await getLocalAttachmentForMessageId(messageId);

  console.log("localAttachment:", localAttachment);

  if (localAttachment) {
    return localAttachment;
  }

  // Only the ones smaller than
  if (
    content.contentLength &&
    parseFloat(content.contentLength) <= MAX_SMALL_ATTACHMENT_SIZE
  ) {
    const decryptedLocalAttachment = await fetchAndDecodeRemoteAttachment({
      account: getCurrentAccount()!,
      messageId: messageId,
      remoteAttachmentContent: content,
    });

    console.log("decryptedLocalAttachment", decryptedLocalAttachment);

    const result = await handleDecryptedLocalAttachment({
      messageId: messageId,
      decryptedLocalAttachment: decryptedLocalAttachment,
    });

    console.log("result:", result);

    return result;
  }

  // if (isRemoteAttachment) {
  // const contentLength = parsedEncodedContent.contentLength;

  // setMessageAttachment(message.id, {
  //   mediaType:
  //     parsedType && isImageMimetype(parsedType) ? "IMAGE" : "UNSUPPORTED",
  //   loading: contentLength <= 10000000,
  //   mediaURL: undefined,
  //   imageSize: undefined,
  //   contentLength,
  //   mimeType: parsedType || "",
  //   filename: parsedEncodedContent.filename,
  //   error: false,
  // });

  // } else {
  //   await saveAndDisplayLocalAttachment(parsedEncodedContent);
  // }
  // } catch (e) {
  //   logger.error(e, { context: "Error parsing message content" });
  //   // setMessageAttachment(message.id, {
  //   //   ...DEFAULT_ATTACHMENT,
  //   //   loading: false,
  //   //   error: true,
  //   // });
  // }
}

// await saveAndDisplayRemoteAttachment(result);
