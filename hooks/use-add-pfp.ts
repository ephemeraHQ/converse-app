import { translate } from "@i18n";
import { executeAfterKeyboardClosed } from "@utils/keyboard";
import { pickMediaFromLibrary, takePictureFromCamera, compressAndResizeImage } from "@utils/media";
import { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useState } from "react";
import { showActionSheet } from "@/components/action-sheet";
import { logger } from "@/utils/logger";
import { getPresignedUploadUrl, uploadFileWithPresignedUrl } from "@/features/uploads/upload.api";
import { useMutation } from "@tanstack/react-query";

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
    "image/jpeg"
  );
  
  logger.debug("[useAddPfp] Profile picture upload complete", { 
    publicUrl,
    originalSize: { width: imageAsset.width, height: imageAsset.height },
    finalSize: { width: resizedImage.width, height: resizedImage.height }
  });

  return publicUrl;
}

export function useAddPfp() {
  const [asset, setAsset] = useState<ImagePickerAsset>();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: uploadImage,
    onError: (error) => {
      logger.error("[useAddPfp] Failed to upload image", { 
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const pickMedia = useCallback(async () => {
    const pickedAsset = await pickMediaFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!pickedAsset) return;
    
    setAsset(pickedAsset);
    return mutateAsync(pickedAsset);
  }, [mutateAsync]);

  const openCamera = useCallback(async () => {
    const pickedAsset = await takePictureFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!pickedAsset) return;
    
    setAsset(pickedAsset);
    return mutateAsync(pickedAsset);
  }, [mutateAsync]);

  const addPFP = useCallback((onAvatarChange: (url: string) => void) => {
    const showOptions = () =>
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
            let uploadedUrl;
            switch (selectedIndex) {
              case 0: // Camera
                uploadedUrl = await openCamera();
                break;
              case 1: // Media Library
                uploadedUrl = await pickMedia();
                break;
            }
            if (uploadedUrl && onAvatarChange) {
              onAvatarChange(uploadedUrl);
            }
          } catch (error) {
            logger.error("[addPFP] Failed to upload image", { error });
          }
        },
      });

    executeAfterKeyboardClosed(showOptions);
  }, [openCamera, pickMedia]);

  const reset = useCallback(() => {
    setAsset(undefined);
  }, []);

  return { 
    addPFP, 
    asset,
    isUploading: isPending,
    reset,
  };
}
