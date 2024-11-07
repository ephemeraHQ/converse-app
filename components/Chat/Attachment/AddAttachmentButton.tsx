import { translate } from "@i18n";
import { MenuView } from "@react-native-menu/menu";
import { textPrimaryColor } from "@styles/colors";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import * as ImagePicker from "expo-image-picker";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { v4 as uuidv4 } from "uuid";

import { useAccountsStore } from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";
import {
  AttachmentSelectedStatus,
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../../utils/media";
import { sentryTrackMessage } from "../../../utils/sentry";
import { encryptRemoteAttachment } from "../../../utils/xmtpRN/attachments";
import ActionButton from "../ActionButton";
import { uploadRemoteAttachment } from "@utils/attachment/uploadRemoteAttachment";

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

type AddAttachmentButtonProps = {
  onSelectionStatusChange: (
    status: AttachmentSelectedStatus,
    attachment: SelectedAttachment
  ) => void;
};

export default function AddAttachmentButton({
  onSelectionStatusChange,
}: AddAttachmentButtonProps) {
  const colorScheme = useColorScheme();
  const mediaPreviewRef = useConversationContext("mediaPreviewRef");
  const currentAccount = useAccountsStore((s) => s.currentAccount);

  const styles = useStyles();
  const currentAttachmentMediaURI = useRef(mediaPreviewRef.current?.mediaURI);
  const assetRef = useRef<ImagePicker.ImagePickerAsset | undefined>(undefined);

  useEffect(() => {
    currentAttachmentMediaURI.current = mediaPreviewRef.current?.mediaURI;
  }, [mediaPreviewRef, mediaPreviewRef.current?.mediaURI]);

  useEffect(() => {
    if (!assetRef.current) {
      assetRef.current = mediaPreviewRef.current?.mediaURI
        ? ({
            uri: mediaPreviewRef.current?.mediaURI,
          } as ImagePicker.ImagePickerAsset)
        : undefined;
    }
  }, [mediaPreviewRef, mediaPreviewRef.current?.mediaURI, assetRef]);

  const handleAttachmentSelected = useCallback(
    async (
      asset: ImagePicker.ImagePickerAsset,
      status: AttachmentSelectedStatus
    ) => {
      if (asset) {
        onSelectionStatusChange("picked", { uri: asset.uri });
        assetRef.current = asset;

        converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
          mediaURI: asset.uri,
          status: "uploading",
          dimensions: {
            height: asset.height,
            width: asset.width,
          },
        });
        const resizedImage = await compressAndResizeImage(asset.uri);
        let mimeType = mime.getType(resizedImage.uri);
        if (!mimeType) {
          const match = resizedImage.uri.match(DATA_MIMETYPE_REGEX);
          if (match && match[1]) {
            mimeType = match[1];
          }
        }
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
          const selectedAttachment: SelectedAttachment = {
            attachmentToSave: {
              filePath: resizedImage.uri,
              fileName: asset.uri.split("/").pop() || `${uuidv4()}`,
              mimeType,
              dimensions: {
                height: resizedImage.height,
                width: resizedImage.width,
              },
            },
            uploadedAttachment,
          };
          onSelectionStatusChange("uploaded", selectedAttachment);
          converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
            mediaURI: asset.uri,
            status: "uploaded",
            dimensions: {
              height: resizedImage.height,
              width: resizedImage.width,
            },
          });
        } catch (error) {
          sentryTrackMessage("ATTACHMENT_UPLOAD_ERROR", { error });
          converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
            mediaURI: asset.uri,
            status: "error",
          });
        }
      }
    },
    [currentAccount, onSelectionStatusChange]
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
    assetRef.current = asset;
    handleAttachmentSelected(asset, "picked");
  }, [handleAttachmentSelected]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera();
    if (!asset) return;
    assetRef.current = asset;
    handleAttachmentSelected(asset, "picked");
  }, [handleAttachmentSelected]);

  return (
    <MenuView
      style={styles.menuButton}
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
        assetRef.current = undefined;
      }}
      actions={[
        {
          id: "mediaLibrary",
          title: translate("photo_library"),
          titleColor: textPrimaryColor(colorScheme),
          imageColor: Platform.select({
            ios: undefined,
            android: textPrimaryColor(colorScheme),
          }),
          image: Platform.select({
            ios: "square.and.arrow.up",
            android: "ic_menu_share",
          }),
        },
        {
          id: "camera",
          title: translate("camera"),
          titleColor: textPrimaryColor(colorScheme),
          imageColor: Platform.select({
            ios: undefined,
            android: textPrimaryColor(colorScheme),
          }),
          image: Platform.select({
            ios: "camera",
            android: "ic_menu_camera",
          }),
        },
      ]}
      shouldOpenOnLongPress={false}
    >
      <ActionButton picto="plus" />
    </MenuView>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    menuButton: {
      justifyContent: "center",
      alignItems: "flex-end",
      flexDirection: "row",
      marginLeft: 16,
      ...Platform.select({
        default: {
          paddingBottom: 6,
          width: 27,
          height: 48,
        },
        android: {
          paddingBottom: 6,
          width: 27,
          height: 27,
        },
      }),
    },
  });
};
