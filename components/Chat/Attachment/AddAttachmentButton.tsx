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
import { sendMessage } from "../../../utils/message";
import { sentryTrackMessage } from "../../../utils/sentry";
import {
  encryptRemoteAttachment,
  serializeRemoteAttachmentMessageContent,
} from "../../../utils/xmtpRN/attachments";
import ActionButton from "../ActionButton";

const DATA_MIMETYPE_REGEX = /data:(.*?);/;

type AddAttachmentButtonProps = {
  onAttachmentSelected: (
    uri: string | null,
    status: AttachmentSelectedStatus
  ) => void;
};

export default function AddAttachmentButton({
  onAttachmentSelected,
}: AddAttachmentButtonProps) {
  const { conversation, mediaPreviewRef } = useConversationContext([
    "conversation",
    "mediaPreviewRef",
  ]);
  const currentAccount = useAccountsStore((s) => s.currentAccount);

  const styles = useStyles();
  const [cameraPermissions, requestCameraPermissions] =
    ImagePicker.useCameraPermissions();
  const currentAttachmentMediaURI = useRef(
    mediaPreviewRef.current?.currentValue?.mediaURI
  );
  const assetRef = useRef<ImagePicker.ImagePickerAsset | undefined>(undefined);
  const uploading = useRef(false);

  useEffect(() => {
    currentAttachmentMediaURI.current =
      mediaPreviewRef.current?.currentValue?.mediaURI;
  }, [mediaPreviewRef, mediaPreviewRef.current?.currentValue?.mediaURI]);

  useEffect(() => {
    if (!conversation) return;
    const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
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
        converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
          mediaURI: asset.uri,
          status: "uploading",
        });
        const uploadedAttachment = await uploadRemoteAttachment(
          currentAccount,
          encryptedAttachment
        );
        converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
          mediaURI: asset.uri,
          status: "uploaded",
        });
        sendMessage({
          conversation,
          content: serializeRemoteAttachmentMessageContent(uploadedAttachment),
          contentType: "xmtp.org/remoteStaticAttachment:1.0",
          attachmentToSave:
            Platform.OS === "web"
              ? undefined
              : {
                  filePath: resizedImage.uri,
                  fileName: asset.uri.split("/").pop() || `${uuidv4()}`,
                  mimeType,
                },
        });
        uploading.current = false;
      } catch (error) {
        uploading.current = false;
        sentryTrackMessage("ATTACHMENT_UPLOAD_ERROR", { error });

        converseEventEmitter.emit("setCurrentConversationMediaPreviewValue", {
          mediaURI: currentAttachmentMediaURI.current || "",
          status: "error",
        });
      }
    };
    if (
      currentAttachmentMediaURI.current &&
      currentAttachmentMediaURI.current === assetRef.current?.uri &&
      mediaPreviewRef.current?.currentValue?.status === "sending" &&
      !uploading.current
    ) {
      uploadAsset(assetRef.current);
    }
  }, [
    conversation,
    currentAccount,
    mediaPreviewRef,
    mediaPreviewRef.current?.currentValue?.mediaURI,
    mediaPreviewRef.current?.currentValue?.status,
  ]);

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
    console.log(assetRef.current);
    onAttachmentSelected(asset.uri, "picked");
  }, [onAttachmentSelected]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera();
    if (!asset) return;
    assetRef.current = asset;
    onAttachmentSelected(asset.uri, "picked");
  }, [onAttachmentSelected]);

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
          height: 27,
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
