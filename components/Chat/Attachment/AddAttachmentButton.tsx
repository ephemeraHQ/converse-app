import { MenuView } from "@react-native-menu/menu";
import * as ImagePicker from "expo-image-picker";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { v4 as uuidv4 } from "uuid";

import { useAccountsStore } from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { useSelect } from "../../../data/store/storeHelpers";
import { uploadRemoteAttachment } from "../../../utils/attachment";
import { useConversationContext } from "../../../utils/conversation";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../../utils/media";
import { sendMessage } from "../../../utils/message";
import { sentryTrackMessage } from "../../../utils/sentry";
import {
  encryptRemoteAttachment,
  serializeRemoteAttachmentMessageContent,
} from "../../../utils/xmtpRN/attachments";
import ActionButton from "../ActionButton";

const DATA_MIMETYPE_REGEX = /data:(.*?);/;

export default function AddAttachmentButton() {
  const { conversation } = useConversationContext(["conversation"]);
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const colorScheme = useColorScheme();

  const styles = useStyles();
  const { mediaPreview, setMediaPreview } = useAppStore(
    useSelect(["mediaPreview", "setMediaPreview"])
  );
  const [cameraPermissions, requestCameraPermissions] =
    ImagePicker.useCameraPermissions();
  const currentAttachmentMediaURI = useRef(mediaPreview?.mediaURI);
  const assetRef = useRef<ImagePicker.ImagePickerAsset | undefined>(undefined);
  const uploading = useRef(false);
  useEffect(() => {
    currentAttachmentMediaURI.current = mediaPreview?.mediaURI;
  }, [mediaPreview?.mediaURI]);

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
        const uploadedAttachment = await uploadRemoteAttachment(
          currentAccount,
          encryptedAttachment
        );
        if (currentAttachmentMediaURI.current !== assetRef.current?.uri) return;
        setMediaPreview(null);
        // Send message
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
        setMediaPreview({
          mediaURI: currentAttachmentMediaURI.current || "",
          sending: false,
          error: true,
        });
      }
    };
    if (
      mediaPreview?.mediaURI &&
      mediaPreview?.mediaURI === assetRef.current?.uri &&
      mediaPreview?.sending &&
      !uploading.current
    ) {
      uploadAsset(assetRef.current);
    }
  }, [
    conversation,
    currentAccount,
    mediaPreview?.mediaURI,
    mediaPreview?.sending,
    setMediaPreview,
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
    setMediaPreview({ mediaURI: asset.uri, sending: false, error: false });
  }, [setMediaPreview]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera();
    if (!asset) return;
    assetRef.current = asset;
    setMediaPreview({ mediaURI: asset.uri, sending: false, error: false });
  }, [setMediaPreview]);

  return (
    <View>
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
    </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    menuButton: {
      flex: 1,
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
