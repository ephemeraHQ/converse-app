import { Image } from "expo-image"

export function prefetchImageUrl(imageUrl: string) {
  return Image.prefetch(imageUrl)
}
