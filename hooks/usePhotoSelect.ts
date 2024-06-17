import { useCallback, useState } from "react";
import { Platform, useColorScheme } from "react-native";

import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import { actionSheetColors } from "../utils/colors";
import { executeAfterKeyboardClosed } from "../utils/keyboard";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../utils/media";

interface PhotoSelect {
  initialPhoto?: string;
  onPhotoAdd?: (newUrl: string) => void;
  isAvatar?: boolean;
}

export const usePhotoSelect = (payload?: PhotoSelect) => {
  const { initialPhoto, onPhotoAdd, isAvatar } = payload ?? {};
  const colorScheme = useColorScheme();
  const [photo, setPhoto] = useState<string | undefined>(initialPhoto);

  const pickMedia = useCallback(async () => {
    const asset = await pickMediaFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    const resizedImage = await compressAndResizeImage(asset.uri, isAvatar);
    setPhoto(resizedImage.uri);
    onPhotoAdd?.(resizedImage.uri);
  }, [onPhotoAdd, isAvatar]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    const resizedImage = await compressAndResizeImage(asset.uri, isAvatar);
    setPhoto(resizedImage.uri);
    onPhotoAdd?.(resizedImage.uri);
  }, [isAvatar, onPhotoAdd]);

  const addPhoto = useCallback(() => {
    const showOptions = () =>
      showActionSheetWithOptions(
        {
          options: ["Take photo", "Choose from library", "Cancel"],
          cancelButtonIndex: 2,
          ...actionSheetColors(colorScheme),
        },
        async (selectedIndex?: number) => {
          switch (selectedIndex) {
            case 0: // Camera
              openCamera();
              break;
            case 1: // Media Library
              pickMedia();
              break;

            default:
              break;
          }
        }
      );
    if (Platform.OS === "web") {
      pickMedia();
    } else {
      executeAfterKeyboardClosed(showOptions);
    }
  }, [colorScheme, openCamera, pickMedia]);

  return { photo, addPhoto };
};
