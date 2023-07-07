import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { setStatusBarHidden } from "expo-status-bar";
import mime from "mime";
import {
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  Alert,
  ColorSchemeName,
  TouchableOpacity,
  View,
  useColorScheme,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import RNFS from "react-native-fs";

import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import { SerializedAttachmentContent } from "../../utils/attachment";
import { actionSheetColors, textSecondaryColor } from "../../utils/colors";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import { sentryTrackMessage } from "../../utils/sentry";
import Picto from "../Picto/Picto";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { sendMessageToWebview } from "../XmtpWebview";

type Props = {
  sendMessage: (content: string, contentType: string) => Promise<void>;
  inputRef: MutableRefObject<TextInput | undefined>;
};

export default function ChatAddAttachment({ sendMessage, inputRef }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state, dispatch } = useContext(AppContext);
  const [cameraPermissions, requestCameraPermissions] =
    ImagePicker.useCameraPermissions();
  const currentAttachmentMediaURI = useRef(state.app.mediaPreview.mediaURI);
  const assetRef = useRef<ImagePicker.ImagePickerAsset | undefined>(undefined);
  const uploading = useRef(false);
  useEffect(() => {
    currentAttachmentMediaURI.current = state.app.mediaPreview.mediaURI;
  }, [state.app.mediaPreview.mediaURI]);

  useEffect(() => {
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
          remoteAttachment: SerializedAttachmentContent;
        }) => {
          if (currentAttachmentMediaURI.current !== assetRef.current?.uri)
            return;
          if (status === "SUCCESS") {
            dispatch({
              type: AppDispatchTypes.AppSetMediaPreview,
              payload: { mediaURI: undefined, sending: false, error: false },
            });
            sendMessage(
              JSON.stringify(remoteAttachment),
              ContentTypeRemoteAttachment.toString()
            );
          } else {
            sentryTrackMessage("ATTACHMENT_UPLOAD_ERROR", { error });
            dispatch({
              type: AppDispatchTypes.AppSetMediaPreview,
              payload: {
                mediaURI: currentAttachmentMediaURI.current,
                sending: false,
                error: true,
              },
            });
          }

          uploading.current = false;
        }
      );
    };
    if (
      state.app.mediaPreview.mediaURI &&
      state.app.mediaPreview.mediaURI === assetRef.current?.uri &&
      state.app.mediaPreview.sending &&
      !uploading.current
    ) {
      uploadAsset(assetRef.current);
    }
  }, [
    dispatch,
    sendMessage,
    state.app.mediaPreview.mediaURI,
    state.app.mediaPreview.sending,
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
    dispatch({
      type: AppDispatchTypes.AppSetMediaPreview,
      payload: { mediaURI: asset.uri, sending: false, error: false },
    });
  }, [dispatch]);

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
    dispatch({
      type: AppDispatchTypes.AppSetMediaPreview,
      payload: { mediaURI: asset.uri, sending: false, error: false },
    });
  }, [dispatch]);

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

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
