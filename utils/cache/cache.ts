import * as Crypto from "expo-crypto"
import RNFS from "react-native-fs"

const getCacheKey = async (mediaURI: string) => {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, mediaURI)
  return digest
}

const CACHE_FOLDER = `file://${RNFS.CachesDirectoryPath}${
  RNFS.CachesDirectoryPath.endsWith("/") ? "" : "/"
}mediacache`

const getCachePathForMedia = async (mediaURI: string) => {
  const cacheKey = await getCacheKey(mediaURI)
  const cachePath = `${CACHE_FOLDER}/${cacheKey}`
  return cachePath
}

export const cacheForMedia = async (mediaURI: string) => {
  const cachePath = await getCachePathForMedia(mediaURI)
  const cacheExists = await RNFS.exists(cachePath)
  return cacheExists ? cachePath : undefined
}

export const fetchAndCacheMedia = async (mediaURI: string) => {
  try {
    const cachePath = await getCachePathForMedia(mediaURI)
    await RNFS.mkdir(CACHE_FOLDER, {
      NSURLIsExcludedFromBackupKey: true,
    })
    await RNFS.downloadFile({
      fromUrl: mediaURI,
      toFile: cachePath,
    }).promise
    return cachePath
  } catch (e) {
    return undefined
  }
}
