export function formatRandomUsername(args: { displayName?: string }) {
  const { displayName = "" } = args

  // Remove whitespace, dots and convert to lowercase
  let cleanDisplayName = displayName
    .replace(/[\s.]+/g, "") // Remove both whitespace and dots
    .toLowerCase()

  // Ensure we have a base string that will generate a valid username
  // @TODO: This is a temporary solution to ensure we have a base string that will generate a valid username
  if (cleanDisplayName.length === 0) {
    cleanDisplayName = "user"
  }

  // Generate 4 random digits
  const randomNumbers = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")

  // Combine name and numbers, ensuring total length doesn't exceed reasonable length
  return `${cleanDisplayName}${randomNumbers}`.slice(0, 20)
}
