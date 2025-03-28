import RNFS, { MkdirOptions } from "react-native-fs"
import crypto from "react-native-quick-crypto"
import RNFetchBlob from "rn-fetch-blob"

/**
 * Normalizes a file path by removing the 'file://' prefix if present
 */
export function normalizeFilePath(path: string): string {
  return path.replace(/^file:\/\//, "")
}

/**
 * Moves a file to a new location, replacing any existing file at the destination.
 * Throws an error if the source file doesn't exist.
 */
export const moveFileAndReplaceIfExist = async (args: { filePath: string; destPath: string }) => {
  const { filePath, destPath } = args

  // Check if source and destination files exist
  const [filePathExists, destPathExists] = await Promise.all([
    RNFS.exists(filePath),
    RNFS.exists(destPath),
  ])

  // Source file must exist
  if (!filePathExists) {
    throw new Error(`File ${filePath} cannot be moved as it does not exist`)
  }

  // Delete destination file if it exists
  if (destPathExists) {
    await RNFS.unlink(destPath)
  }

  // Move the file
  await RNFS.moveFile(filePath, destPath)
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    const normalizedPath = normalizeFilePath(path)
    return await RNFetchBlob.fs.exists(normalizedPath)
  } catch (error) {
    console.error("Error checking file existence:", error)
    return false
  }
}

export async function getFileSize(path: string): Promise<number> {
  try {
    const normalizedPath = normalizeFilePath(path)
    const stats = await RNFetchBlob.fs.stat(normalizedPath)
    return stats.size
  } catch (error) {
    console.error("Error getting file size:", error)
    return 0
  }
}

export async function calculateFileDigest(path: string): Promise<string> {
  try {
    const normalizedPath = normalizeFilePath(path)
    // Read raw bytes using RNFetchBlob
    const data = await RNFetchBlob.fs.readFile(normalizedPath, "base64")
    const buffer = Buffer.from(data, "base64")
    const hash = crypto.createHash("sha256")
    hash.update(buffer.toString("binary"))
    return hash.digest("hex")
  } catch (error) {
    console.error("Error calculating file digest:", error)
    throw error
  }
}

export async function saveFile(args: {
  path: string
  data: string
  encodingOrOptions: "base64" | "utf8"
}) {
  const { path, data, encodingOrOptions } = args
  await RNFS.writeFile(path, data, encodingOrOptions)
}

export async function createFolderIfNotExists(args: { path: string; options?: MkdirOptions }) {
  const { path, options } = args
  if (!(await RNFS.exists(path))) {
    await RNFS.mkdir(path, options)
  }
}
