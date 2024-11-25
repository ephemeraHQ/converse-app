import { Icon } from "@design-system/Icon/Icon";
import { Pressable } from "@design-system/Pressable";
import { translate } from "@i18n";
import { MenuView } from "@react-native-menu/menu";
import { useAppTheme } from "@theme/useAppTheme";
import { uploadRemoteAttachment } from "@utils/attachment/uploadRemoteAttachment";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import * as ImagePicker from "expo-image-picker";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import { Platform } from "react-native";
import { getCurrentAccount } from "../../../data/store/accountsStore";
import {
  setComposerMediaPreview,
  setComposerMediaPreviewStatus,
  setUploadedRemoteAttachment,
} from "../../../features/conversation/conversation-service";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../../utils/media";
import { sentryTrackError, sentryTrackMessage } from "../../../utils/sentry";
import { encryptRemoteAttachment } from "../../../utils/xmtpRN/attachments";

const DATA_MIMETYPE_REGEX = /data:(.*?);/;

type AttachmentToSave = {
  filePath: string;
  fileName: string;
  mimeType: string | null;
  dimensions: {
    height: number;
    width: number;
  };
};

export type SelectedAttachment = {
  uploadedAttachment?: RemoteAttachmentContent;
  attachmentToSave?: AttachmentToSave;
  uri?: string;
};

export function AddAttachmentButton() {
  const { theme } = useAppTheme();

  return (
    <MenuView
      style={{
        margin: theme.spacing.xxxs,
        alignSelf: "flex-end",
      }}
      onPressAction={async ({ nativeEvent }) => {
        switch (nativeEvent.event) {
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
          titleColor: theme.colors.text.primary,
          imageColor: Platform.select({
            ios: undefined,
            android: theme.colors.text.primary,
          }),
          image: Platform.select({
            ios: "square.and.arrow.up",
            android: "ic_menu_share",
          }),
        },
        {
          id: "camera",
          title: translate("camera"),
          titleColor: theme.colors.text.primary,
          imageColor: Platform.select({
            ios: undefined,
            android: theme.colors.text.primary,
          }),
          image: Platform.select({
            ios: "camera",
            android: "ic_menu_camera",
          }),
        },
      ]}
      shouldOpenOnLongPress={false}
    >
      <Pressable
        style={{
          alignItems: "center",
          justifyContent: "center",
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
      </Pressable>
    </MenuView>
  );
}

async function pickMedia() {
  if (Platform.OS === "ios") {
    setStatusBarHidden(true, "fade");
  }
  const asset = await pickMediaFromLibrary();
  if (Platform.OS === "ios") {
    setStatusBarHidden(false, "fade");
  }
  if (!asset) return;
  handleAttachmentSelected(asset);
}

async function openCamera() {
  const asset = await takePictureFromCamera();
  if (!asset) return;
  handleAttachmentSelected(asset);
}

async function handleAttachmentSelected(asset: ImagePicker.ImagePickerAsset) {
  if (asset) {
    try {
      setComposerMediaPreview({
        mediaURI: asset.uri,
        status: "picked",
        mimeType: null,
        dimensions: {
          height: asset.height,
          width: asset.width,
        },
      });

      setComposerMediaPreviewStatus("uploading");

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

        setUploadedRemoteAttachment(uploadedAttachment);
        setComposerMediaPreviewStatus("uploaded");
      } catch (error) {
        sentryTrackMessage("ATTACHMENT_UPLOAD_ERROR", { error });
      }
    } catch (error) {
      sentryTrackError(error);
    }
  }
}
