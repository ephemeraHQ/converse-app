import { MenuView } from "@react-native-menu/menu";
import * as ImagePicker from "expo-image-picker";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import { v4 as uuidv4 } from "uuid";

import { useAccountsStore } from "../../../data/store/accountsStore";
import { uploadRemoteAttachment } from "../../../utils/attachment";
import { useConversationContext } from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
  AttachmentSelectedStatus,
} from "../../../utils/media";
import { sentryTrackMessage } from "../../../utils/sentry";
import { encryptRemoteAttachment } from "../../../utils/xmtpRN/attachments";
import ActionButton from "../ActionButton";

const DATA_MIMETYPE_REGEX = /data:(.*?);/;

type AddAttachmentButtonProps = {
  onSelectionStatusChange: (
    status: AttachmentSelectedStatus,
    attachment: any
  ) => void;
};

export default function AddAttachmentButton({
  onSelectionStatusChange,
}: AddAttachmentButtonProps) {
  const { conversation, mediaPreviewRef } = useConversationContext([
    "conversation",
    "mediaPreviewRef",
  ]);
  const currentAccount = useAccountsStore((s) => s.currentAccount);

  const styles = useStyles();
  const [cameraPermissions, requestCameraPermissions] =
    ImagePicker.useCameraPermissions();
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
    async (uri: string | null, status: AttachmentSelectedStatus) => {
      if (uri) {
        onSelectionStatusChange("picked", { uri });
        const asset = { uri } as ImagePicker.ImagePickerAsset;
        assetRef.current = asset;

        converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
          mediaURI: asset.uri,
          status: "uploading",
        });
        const resizedImage = await compressAndResizeImage(asset.uri);
        let mimeType = mime.getType(resizedImage.uri);
        if (!mimeType && Platform.OS === "web") {
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
          onSelectionStatusChange("uploaded", {
            ...uploadedAttachment,
            attachmentToSave:
              Platform.OS === "web"
                ? undefined
                : {
                    filePath: resizedImage.uri,
                    fileName: asset.uri.split("/").pop() || `${uuidv4()}`,
                    mimeType,
                  },
          });
          converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
            mediaURI: asset.uri,
            status: "uploaded",
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
    handleAttachmentSelected(asset.uri, "picked");
  }, [handleAttachmentSelected]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera();
    if (!asset) return;
    assetRef.current = asset;
    handleAttachmentSelected(asset.uri, "picked");
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
        if (Platform.OS === "web") {
          pickMedia();
        }
      }}
      actions={[
        {
          id: "mediaLibrary",
          title: "Photo Library",
          image: Platform.select({
            ios: "square.and.arrow.up",
            android: "square.and.arrow.up",
          }),
        },
        {
          id: "camera",
          title: "Camera",
          image: Platform.select({
            ios: "camera",
            android: "camera",
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
