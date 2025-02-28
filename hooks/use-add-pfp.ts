import { translate } from "@i18n";
import { useMutation } from "@tanstack/react-query";
import { executeAfterKeyboardClosed } from "@utils/keyboard";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "@utils/media";
import { ImagePickerAsset, ImagePickerOptions } from "expo-image-picker";
import { useCallback, useState } from "react";
import { showActionSheet } from "@/components/action-sheet";
import {
  getPresignedUploadUrl,
  uploadFileWithPresignedUrl,
} from "@/features/uploads/upload.api";
import { logger } from "@/utils/logger";

type ImageSource = "camera" | "library";

/**
 * Uploads an image asset to the server
 * Handles compression, getting presigned URL, and uploading
 */
async function uploadImage(imageAsset: ImagePickerAsset): Promise<string> {
  logger.debug("[useAddPfp] Starting image compression", {
    originalUri: imageAsset.uri,
    originalWidth: imageAsset.width,
    originalHeight: imageAsset.height,
  });

  // Compress and resize the image
  const resizedImage = await compressAndResizeImage(imageAsset.uri, true);

  logger.debug("[useAddPfp] Image compressed successfully", {
    compressedUri: resizedImage.uri,
    width: resizedImage.width,
    height: resizedImage.height,
  });

  // Get presigned URL for upload
  logger.debug("[useAddPfp] Getting presigned URL");
  const { url: presignedUrl } = await getPresignedUploadUrl("image/jpeg");

  // Upload the image
  const publicUrl = await uploadFileWithPresignedUrl(
    presignedUrl,
    resizedImage.uri,
    "image/jpeg",
  );

  logger.debug("[useAddPfp] Profile picture upload complete", {
    publicUrl,
    originalSize: { width: imageAsset.width, height: imageAsset.height },
    finalSize: { width: resizedImage.width, height: resizedImage.height },
  });

  return publicUrl;
}

export function useAddPfp() {
  const [asset, setAsset] = useState<ImagePickerAsset>();

  const {
    mutateAsync: uploadImageAsync,
    isPending: isUploading,
    data: uploadedImageUrl,
    error: errorUploadingImage,
  } = useMutation({
    mutationFn: uploadImage,
  });

  /**
   * Shows an action sheet and lets the user pick a profile picture
   * Returns a promise that resolves with the uploaded image URL
   */
  const addPFP = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      const showOptions = () => {
        showActionSheet({
          options: {
            options: [
              translate("userProfile.mediaOptions.takePhoto"),
              translate("userProfile.mediaOptions.chooseFromLibrary"),
              translate("userProfile.mediaOptions.cancel"),
            ],
            cancelButtonIndex: 2,
          },
          callback: async (selectedIndex?: number) => {
            try {
              let source: ImageSource | undefined;

              switch (selectedIndex) {
                case 0:
                  source = "camera";
                  break;
                case 1:
                  source = "library";
                  break;
                default:
                  // User canceled
                  return;
              }

              if (!source) {
                return;
              }

              const options: ImagePickerOptions = {
                allowsEditing: true,
                aspect: [1, 1],
              };

              // Get image from selected source
              const pickedAsset =
                source === "camera"
                  ? await takePictureFromCamera(options)
                  : await pickMediaFromLibrary(options);

              if (!pickedAsset) {
                reject(new Error("No image selected"));
                return;
              }

              // Update state and upload
              setAsset(pickedAsset);
              const uploadedUrl = await uploadImageAsync(pickedAsset);
              resolve(uploadedUrl);
            } catch (error) {
              reject(error);
            }
          },
        });
      };

      executeAfterKeyboardClosed(showOptions);
    });
  }, [uploadImageAsync]);

  const reset = () => {
    setAsset(undefined);
  };

  return {
    addPFP,
    asset,
    isUploading,
    reset,
    uploadedImageUrl,
    errorUploadingImage,
  };
}
