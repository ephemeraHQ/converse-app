import RNFS from "react-native-fs"
import { GenericError } from "@/utils/error"
import { fileExists } from "@/utils/file-system/file-system"

export const downloadRemoteAttachment = async (args: { url: string }) => {
  const { url } = args

  try {
    // Download directly to a temporary file
    const separator = RNFS.CachesDirectoryPath.endsWith("/") ? "" : "/"
    const tempPath = `${RNFS.CachesDirectoryPath}${separator}${Date.now()}.tmp`
    const localFileUri = `file://${tempPath}`

    const downloadResult = await RNFS.downloadFile({
      fromUrl: url,
      toFile: tempPath,
    }).promise

    if (downloadResult.statusCode !== 200) {
      throw new Error(`Download failed with status ${downloadResult.statusCode}`)
    }

    const exists = await fileExists(localFileUri)

    if (!exists) {
      throw new Error("Downloaded file not found")
    }

    return localFileUri
  } catch (error) {
    throw new GenericError({
      error,
      additionalMessage: "Failed to download attachment",
    })
  }
}
