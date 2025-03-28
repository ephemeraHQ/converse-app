import { Icon, iconRegistry } from "@design-system/Icon/Icon"
import { translate } from "@i18n"
import {
  compressAndResizeImage,
  getMimeTypeFromAsset,
  pickMultipleMediaFromLibrary,
  takePictureFromCamera,
} from "@utils/media"
import * as ImagePicker from "expo-image-picker"
import { useCallback } from "react"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { Center } from "@/design-system/Center"
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu"
import { useConversationComposerStore } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer.store-context"
import { useConversationComposerIsEnabled } from "@/features/conversation/conversation-chat/conversation-composer/hooks/conversation-composer-is-enabled"
import { uploadFile } from "@/features/uploads/upload.api"
import { Xmtp } from "@/features/xmtp"
import { useAppTheme } from "@/theme/use-app-theme"
import { convertToArray } from "@/utils/array"
import { captureError, captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { prefetchImageUrl } from "@/utils/image"

export function AddAttachmentButton() {
  const { theme } = useAppTheme()

  const store = useConversationComposerStore()
  const isEnabled = useConversationComposerIsEnabled()

  const handleAttachmentSelected = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      const mediaPreview = {
        mediaURI: asset.uri,
        mimeType: asset.mimeType,
        dimensions: {
          width: asset.width,
          height: asset.height,
        },
        status: "picked" as const,
      }

      // Add preview and get its URI as ID
      const mediaURI = store.getState().addComposerMediaPreview(mediaPreview)

      try {
        // Update status to uploading
        store.getState().updateMediaPreviewStatus(mediaURI, "uploading")

        // Compress and resize image
        const resizedImage = await compressAndResizeImage(asset.uri)

        const mimeType = getMimeTypeFromAsset(asset)

        if (!mimeType) {
          throw new GenericError({
            error: new Error("Failed to get mime type"),
          })
        }

        // Encrypt and upload attachment
        const encryptedAttachment = await Xmtp.encryptAttachment({
          fileUri: resizedImage.uri,
          mimeType,
        })

        // Upload file
        const publicUrl = await uploadFile({
          filePath: encryptedAttachment.encryptedLocalFileUri,
          contentType: mimeType,
        })

        prefetchImageUrl(publicUrl).catch(captureError)

        // Add uploaded attachment
        store.getState().addComposerUploadedAttachment({
          mediaURI,
          attachment: {
            url: publicUrl,
            contentDigest: encryptedAttachment.metadata.contentDigest,
            secret: encryptedAttachment.metadata.secret,
            salt: encryptedAttachment.metadata.salt,
            nonce: encryptedAttachment.metadata.nonce,
            filename:
              encryptedAttachment.metadata.filename || asset.uri.split("/").pop() || "attachment",
            contentLength: String(encryptedAttachment.metadata.contentLength) || "0",
            scheme: "https://",
          },
        })

        // Update status to uploaded
        store.getState().updateMediaPreviewStatus(mediaURI, "uploaded")
      } catch (error) {
        // Update status to error
        store.getState().updateMediaPreviewStatus(mediaURI, "error")
        // Remove media preview
        store.getState().removeComposerMediaPreview(mediaURI)
        captureErrorWithToast(
          new GenericError({ error, additionalMessage: "Failed to add attachment" }),
        )
      }
    },
    [store],
  )

  const pickMedia = useCallback(async () => {
    const assets = await pickMultipleMediaFromLibrary()

    if (!assets) {
      return
    }

    // Process each asset
    await Promise.allSettled(convertToArray(assets).map(handleAttachmentSelected)).then(
      (results: PromiseSettledResult<void>[]) => {
        const failedCount = results.filter((result) => result.status === "rejected").length
        if (failedCount > 0) {
          showSnackbar({
            message: `Failed to process ${failedCount} attachment${failedCount > 1 ? "s" : ""}`,
            type: "error",
          })
        }
      },
    )
  }, [handleAttachmentSelected])

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera()

    if (!asset) {
      return
    }

    await handleAttachmentSelected(asset)
  }, [handleAttachmentSelected])

  const onDropdownMenuPress = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "camera":
          openCamera()
          break
        case "mediaLibrary":
          pickMedia()
          break
      }
    },
    [openCamera, pickMedia],
  )

  return (
    <DropdownMenu
      disabled={!isEnabled}
      style={{
        margin: theme.spacing.xxxs,
        alignSelf: "flex-end",
      }}
      onPress={onDropdownMenuPress}
      actions={[
        {
          id: "mediaLibrary",
          title: translate("photo_library"),
          image: iconRegistry["photos"],
        },
        {
          id: "camera",
          title: translate("camera"),
          image: iconRegistry["camera"],
        },
      ]}
    >
      <Center
        style={{
          height: 36, // Value from Figma
          width: 36, // Value from Figma
          backgroundColor: theme.colors.fill.minimal,
          borderRadius: 36,
        }}
      >
        <Icon
          color={theme.colors.text.secondary}
          icon="plus"
          size={theme.iconSize.sm}
          weight="medium"
        />
      </Center>
    </DropdownMenu>
  )
}
