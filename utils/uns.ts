const ALLOWED_UNS_SUFFIXES = [
  ".crypto",
  ".bitcoin",
  ".blockchain",
  ".dao",
  ".nft",
  ".888",
  ".wallet",
  ".x",
  ".klever",
  ".zil",
  ".hi",
  ".kresus",
  ".polygon",
  ".anime",
  ".manga",
  ".binanceus",
]

export const isUNSAddress = (address: string): boolean => {
  // Bail out early if empty string or a string without any dots
  if (!address || !address.includes(".")) {
    return false
  }
  return ALLOWED_UNS_SUFFIXES.some((suffix) => address.endsWith(suffix))
}
