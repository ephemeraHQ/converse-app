import { getConfig } from "@/config"

const config = getConfig()

type IUsernameResult = {
  isConverseUsername: boolean
  username: string
}

/**
 * Formats usernames from Converse domains by extracting the username part and adding @ prefix
 * Returns a result object containing whether it's a Converse username and the formatted/raw username
 * @param username - The username to format
 * @returns Object containing isConverseUsername flag and formatted/raw username
 */
export function formatConverseUsername(username: string | undefined): IUsernameResult | undefined {
  if (!username) return undefined

  // Check if it's a Converse username (either domain)
  if (username.endsWith(config.usernameSuffix)) {
    // Extract everything before the domain
    const cleanUsername = username.replace(config.usernameSuffix, "")
    return {
      isConverseUsername: true,
      username: `@${cleanUsername}`,
    }
  }

  // Return the raw username for non-Converse usernames
  return {
    isConverseUsername: false,
    username: username,
  }
}
