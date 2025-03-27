import { Dimensions } from "react-native"

export const shortDisplayName = (displayName: string | undefined): string => {
  if (!displayName) return ""

  const screenWidth = Dimensions.get("window").width
  let maxLength

  if (screenWidth > 800) {
    // For iPad and mac app
    maxLength = 30
  } else if (screenWidth > 400) {
    // For iPhone Plus and Pro Max
    maxLength = 15
  } else {
    // For iPhone Mini, iPhone, and iPhone Pro
    maxLength = 12
  }

  return displayName.length > maxLength ? `${displayName.slice(0, maxLength)}...` : displayName
}

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

export const addressPrefix = (address: string) =>
  (address && address.length >= 6 ? address.slice(0, 6) : address) || ""

export function normalizeString(str: string) {
  return str.toLowerCase().trim()
}

export function isSameTrimmedAndNormalizedString(str1: string, str2: string) {
  return normalizeString(str1) === normalizeString(str2)
}

// Helper to get the last N bytes of a string, making sure we don't cut in the middle of a line
export function getLastBytes(str: string, maxBytes: number): string {
  if (Buffer.byteLength(str, "utf8") <= maxBytes) {
    return str
  }

  // Get roughly the last maxBytes worth of characters
  // We get more than needed to ensure we don't cut mid-line
  const roughSlice = str.slice(-maxBytes * 2)

  // Find the first newline to get a clean cut
  const firstNewLine = roughSlice.indexOf("\n")
  const cleanSlice = firstNewLine !== -1 ? roughSlice.slice(firstNewLine + 1) : roughSlice

  // If still too big, get exact bytes from the end
  if (Buffer.byteLength(cleanSlice, "utf8") > maxBytes) {
    return `...(truncated)...\n${cleanSlice.slice(-maxBytes)}`
  }

  return `...(truncated)...\n${cleanSlice}`
}
