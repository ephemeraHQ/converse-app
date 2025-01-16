import { Center } from "@/design-system/Center";
import { Menu } from "@/design-system/Menu/Menu";
import { useConversationComposerStore } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { getCurrentAccount } from "@data/store/accountsStore";
import { Icon } from "@design-system/Icon/Icon";
import { translate } from "@i18n";
import { useAppTheme } from "@theme/useAppTheme";
import { uploadRemoteAttachment } from "@utils/attachment/uploadRemoteAttachment";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "@utils/media";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { encryptRemoteAttachment } from "@utils/xmtpRN/attachments";
import * as ImagePicker from "expo-image-picker";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import { useCallback } from "react";
import { Platform } from "react-native";

const DATA_MIMETYPE_REGEX = /data:(.*?);/;

export function AddAttachmentButton() {
  const { theme } = useAppTheme();

  const store = useConversationComposerStore();

  const handleAttachmentSelected = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      try {
        store.getState().setComposerMediaPreview({
          mediaURI: asset.uri,
          status: "picked",
          mimeType: undefined,
          dimensions: {
            height: asset.height,
            width: asset.width,
          },
        });

        store.getState().updateMediaPreviewStatus("uploading");

        const resizedImage = await compressAndResizeImage(asset.uri);

        let mimeType = mime.getType(resizedImage.uri);
        if (!mimeType) {
          const match = resizedImage.uri.match(DATA_MIMETYPE_REGEX);
          if (match && match[1]) {
            mimeType = match[1];
          }
        }

        const currentAccount = getCurrentAccount()!;

        const encryptedAttachment = await encryptRemoteAttachment(
          currentAccount,
          resizedImage.uri,
          mimeType || undefined
        );

        try {
          const uploadedAttachment = await uploadRemoteAttachment(
            currentAccount,
            encryptedAttachment
          );

          store.getState().updateMediaPreviewStatus("uploaded");

          store.getState().setComposerUploadedAttachment(uploadedAttachment);
        } catch (error) {
          sentryTrackMessage("ATTACHMENT_UPLOAD_ERROR", { error });
        }
      } catch (error) {
        sentryTrackError(error);
      }
    },
    [store]
  );

  const pickMedia = useCallback(async () => {
    if (Platform.OS === "ios") {
      setStatusBarHidden(true, "fade");
    }
    const asset = await pickMediaFromLibrary();
    if (Platform.OS === "ios") {
      setStatusBarHidden(false, "fade");
    }
    if (!asset) return;
    handleAttachmentSelected(asset);
  }, [handleAttachmentSelected]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera();
    if (!asset) return;
    handleAttachmentSelected(asset);
  }, [handleAttachmentSelected]);

  return (
    <Menu
      style={{
        margin: theme.spacing.xxxs,
        alignSelf: "flex-end",
      }}
      onPress={(actionId) => {
        switch (actionId) {
          case "camera":
            openCamera();
            break;
          case "mediaLibrary":
            pickMedia();
            break;
          default:
            break;
        }
      }}
      actions={[
        {
          id: "mediaLibrary",
          title: translate("photo_library"),
          image: Platform.select({
            ios: "square.and.arrow.up",
            android: "ic_menu_share",
          }),
        },
        {
          id: "camera",
          title: translate("camera"),
          image: Platform.select({
            ios: "camera",
            android: "ic_menu_camera",
          }),
        },
      ]}
    >
      <Center
        style={{
          height: 36, // Value from Figma
          width: 36, // Value from Figma
          backgroundColor: theme.colors.fill.minimal,
          borderRadius: 36,
        }}
      >
        <Icon
          color={theme.colors.text.secondary}
          icon="plus"
          size={20} // Value from figma
        />
      </Center>
    </Menu>
  );
}
