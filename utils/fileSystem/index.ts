import RNFS from "react-native-fs"

export const moveFileAndReplace = async (filePath: string, destPath: string) => {
  const [filePathExists, destPathExists] = await Promise.all([
    RNFS.exists(filePath),
    RNFS.exists(destPath),
  ])
  if (!filePathExists) {
    throw new Error(`File ${filePath} cannot be moved as it does not exist`)
  }
  if (destPathExists) {
    console.warn(`Trying to move file that already exists: ${destPath}`)
    await RNFS.unlink(destPath)
  }
  await RNFS.moveFile(filePath, destPath)
}
