import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  TouchableOpacity,
  View,
  useColorScheme,
  StyleSheet,
  Platform,
} from "react-native";
import RNFS from "react-native-fs";

import { useAppStore } from "../../data/store/appStore";
import { SerializedRemoteAttachmentContent } from "../../utils/attachment";
import { actionSheetColors, textSecondaryColor } from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import { sendMessage } from "../../utils/message";
import { pick } from "../../utils/objects";
import { sentryTrackMessage } from "../../utils/sentry";
import Picto from "../Picto/Picto";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { sendMessageToWebview } from "../XmtpWebview";

export default function ChatAddAttachment() {
  const { conversation } = useConversationContext(["conversation"]);
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { mediaPreview, setMediaPreview } = useAppStore((s) =>
    pick(s, ["mediaPreview", "setMediaPreview"])
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
      uploading.current = true;
      const base64Content = await RNFS.readFile(asset.uri, "base64");
      const filename = asset.fileName || asset.uri.split("/").pop();
      sendMessageToWebview(
        "UPLOAD_ATTACHMENT",
        {
          filename,
          base64Content,
          mimeType: mime.getType(filename || ""),
        },
        async ({
          status,
          error,
          remoteAttachment,
        }: {
          status: string;
          error: string;
          remoteAttachment: SerializedRemoteAttachmentContent;
        }) => {
          if (currentAttachmentMediaURI.current !== assetRef.current?.uri)
            return;
          if (status === "SUCCESS") {
            setMediaPreview(null);
            sendMessage(
              conversation,
              JSON.stringify(remoteAttachment),
              ContentTypeRemoteAttachment.toString()
            );
          } else if (currentAttachmentMediaURI.current) {
            sentryTrackMessage("ATTACHMENT_UPLOAD_ERROR", { error });
            setMediaPreview({
              mediaURI: currentAttachmentMediaURI.current,
              sending: false,
              error: true,
            });
          }

          uploading.current = false;
        }
      );
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
    mediaPreview?.mediaURI,
    mediaPreview?.sending,
    setMediaPreview,
  ]);

  const pickMedia = useCallback(async () => {
    if (Platform.OS === "ios") {
      setStatusBarHidden(true, "fade");
    }
    const mediaPicked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: false,
      allowsMultipleSelection: false,
    });
    if (Platform.OS === "ios") {
      setStatusBarHidden(false, "fade");
    }
    if (mediaPicked.canceled) return;
    const asset = mediaPicked.assets?.[0];
    if (!asset) return;
    assetRef.current = asset;
    setMediaPreview({ mediaURI: asset.uri, sending: false, error: false });
  }, [setMediaPreview]);

  const openCamera = useCallback(async () => {
    const mediaPicked = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: false,
      allowsEditing: false,
    });
    if (mediaPicked.canceled) return;
    const asset = mediaPicked.assets?.[0];
    if (!asset) return;
    assetRef.current = asset;
    setMediaPreview({ mediaURI: asset.uri, sending: false, error: false });
  }, [setMediaPreview]);

  const tryToOpenCamera = useCallback(async () => {
    if (!cameraPermissions?.granted) {
      if (cameraPermissions?.canAskAgain) {
        const result = await requestCameraPermissions();
        if (result.granted) {
          await openCamera();
        }
      } else {
        Alert.alert(
          "You need to grant Converse access to the camera before proceeding",
          undefined,
          [
            {
              text: "Settings",
              isPreferred: true,
              onPress: () => {
                Linking.openSettings();
              },
            },
            { text: "Close" },
          ]
        );
      }
    } else {
      await openCamera();
    }
  }, [
    cameraPermissions?.canAskAgain,
    cameraPermissions?.granted,
    openCamera,
    requestCameraPermissions,
  ]);

  return (
    <TouchableOpacity
      onPress={() => {
        const showOptions = () =>
          showActionSheetWithOptions(
            {
              options: ["Camera", "Photo Library", "Cancel"],
              cancelButtonIndex: 2,
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              switch (selectedIndex) {
                case 0: // Camera
                  tryToOpenCamera();
                  break;
                case 1: // Media Library
                  pickMedia();
                  break;

                default:
                  break;
              }
            }
          );

        executeAfterKeyboardClosed(showOptions);
        assetRef.current = undefined;
      }}
      activeOpacity={0.4}
    >
      <View style={styles.attachmentButton}>
        <Picto
          picto="plus"
          color={textSecondaryColor(colorScheme)}
          size={Platform.OS === "android" ? 30 : 20}
        />
      </View>
    </TouchableOpacity>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    attachmentButton: {
      flex: 1,
      justifyContent: "center",
      alignItems: "flex-end",
      flexDirection: "row",
      marginLeft: 12,
      ...Platform.select({
        default: {
          paddingBottom: 24,
          width: 27,
          height: 27,
        },
        android: {
          paddingBottom: 8,
          width: 27,
          height: 27,
        },
      }),
    },
  });
};
