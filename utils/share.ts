import * as Sharing from "expo-sharing"

/**
 * Check if sharing functionality is available on the device
 */
export const isShareAvailable = async () => {
  return await Sharing.isAvailableAsync()
}

/**
 * Share content using the native sharing dialog
 */
export const shareContent = async (args: { title: string; url: string; type: string }) => {
  const { title, url, type } = args

  // Check if sharing is available on the device
  const isAvailable = await isShareAvailable()

  if (!isAvailable) {
    throw new Error("Sharing is not available on this device")
  }

  return Sharing.shareAsync(url, {
    dialogTitle: title,
    UTI: type, // Used for iOS
    mimeType: type, // Used for Android
  })
}
