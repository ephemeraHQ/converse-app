import { actionSheetColors } from "@styles/colors";
import { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useState } from "react";
import { useColorScheme } from "react-native";

import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { translate } from "@i18n";
import { executeAfterKeyboardClosed } from "@utils/keyboard";
import { pickMediaFromLibrary, takePictureFromCamera } from "@utils/media";

export function useAddPfp() {
  const [asset, setAsset] = useState<ImagePickerAsset>();

  const colorScheme = useColorScheme();

  const pickMedia = useCallback(async () => {
    const asset = await pickMediaFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    setAsset(asset);
  }, []);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    setAsset(asset);
  }, []);

  const addPFP = useCallback(() => {
    const showOptions = () =>
      showActionSheetWithOptions(
        {
          options: [
            translate("userProfile.mediaOptions.takePhoto"),
            translate("userProfile.mediaOptions.chooseFromLibrary"),
            translate("userProfile.mediaOptions.cancel"),
          ],
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

    executeAfterKeyboardClosed(showOptions);
  }, [colorScheme, openCamera, pickMedia]);

  return { addPFP, asset };
}
