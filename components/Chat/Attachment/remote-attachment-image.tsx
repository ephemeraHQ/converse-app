import { AttachmentLoading } from "@/components/Chat/Attachment/attachment-loading";
import { getCurrentAccount } from "@data/store/accountsStore";
import { Icon } from "@design-system/Icon/Icon";
import { Text } from "@design-system/Text";
import { IVStackProps, VStack } from "@design-system/VStack";
import { PressableScale } from "@design-system/pressable-scale";
import { translate } from "@i18n";
import { useQuery } from "@tanstack/react-query";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalAttachmentForMessageId } from "@utils/attachment/getLocalAttachment";
import { handleDecryptedLocalAttachment } from "@utils/attachment/handleDecryptedLocalAttachment";
import {
  MAX_AUTOMATIC_DOWNLOAD_ATTACHMENT_SIZE,
  fetchAndDecodeRemoteAttachment,
} from "@utils/xmtpRN/attachments";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { Image } from "expo-image";
import prettyBytes from "pretty-bytes";
import { memo } from "react";

type IRemoteAttachmentImageProps = {
  messageId: string;
  remoteMessageContent: RemoteAttachmentContent;
  fitAspectRatio?: boolean;
  containerProps?: IVStackProps;
};

export const RemoteAttachmentImage = memo(function RemoteAttachmentImage(
  props: IRemoteAttachmentImageProps
) {
  const { messageId, remoteMessageContent, fitAspectRatio, containerProps } =
    props;

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

  if (!attachment && attachmentLoading) {
    return (
      <AttachmentPreviewContainer {...containerProps}>
        <AttachmentLoading />
      </AttachmentPreviewContainer>
    );
  }

  if (attachmentError || !attachment) {
    return (
      <AttachmentPreviewContainer {...containerProps}>
        <Text>{translate("attachment_message_error_download")}</Text>
      </AttachmentPreviewContainer>
    );
  }

  if (!attachment.mediaURL) {
    return (
      <PressableScale onPress={() => refetchAttachment()}>
        <AttachmentPreviewContainer {...containerProps}>
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
        <AttachmentPreviewContainer {...containerProps}>
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

  const aspectRatio =
    fitAspectRatio && attachment.imageSize
      ? attachment.imageSize.width / attachment.imageSize.height
      : undefined;

  const { style, ...rest } = containerProps || {};

  return (
    <AttachmentPreviewContainer style={[{ aspectRatio }, style]} {...rest}>
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
          // ...debugBorder(),
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

async function fetchAttachment(
  messageId: string,
  content: RemoteAttachmentContent
) {
  const localAttachment = await getLocalAttachmentForMessageId(messageId);

  if (localAttachment) {
    return localAttachment;
  }

  if (
    content.contentLength &&
    parseFloat(content.contentLength) <= MAX_AUTOMATIC_DOWNLOAD_ATTACHMENT_SIZE
  ) {
    const decryptedLocalAttachment = await fetchAndDecodeRemoteAttachment({
      account: getCurrentAccount()!,
      messageId: messageId,
      remoteAttachmentContent: content,
    });

    const result = await handleDecryptedLocalAttachment({
      messageId: messageId,
      decryptedLocalAttachment: decryptedLocalAttachment,
    });

    return result;
  }

  return null;
}
