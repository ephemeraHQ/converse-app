import { actionSheetColors } from "@styles/colors";
import { useCallback, useState } from "react";
import { useColorScheme } from "react-native";

import { showActionSheet } from "../components-name/StateHandlers/ActionSheetStateHandler";
import { executeAfterKeyboardClosed } from "../utils/keyboard";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../utils/media";

type PhotoSelect = {
  initialPhoto?: string;
  onPhotoAdd?: (newUrl: string) => void;
  isAvatar?: boolean;
};

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
    executeAfterKeyboardClosed(() =>
      showActionSheet({
        options: {
          options: ["Take photo", "Choose from library", "Cancel"],
          cancelButtonIndex: 2,
          ...actionSheetColors(colorScheme),
        },
        callback: async (selectedIndex?: number) => {
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
        },
      })
    );
  }, [colorScheme, openCamera, pickMedia]);

  return { photo, addPhoto };
};
