import { getConfig } from "@/config";

/**
 * Formats usernames from Converse domains by extracting the username part and adding @ prefix
 * Returns undefined for non-Converse usernames
 * @param username - The username to format
 * @returns The formatted username with @ prefix if it's a Converse username, undefined otherwise
 */
export function formatUsername(
  username: string | undefined
): string | undefined {
  if (!username) return undefined;

  // Check if it's a Converse username (either domain)
  if (username.endsWith(getConfig().usernameSuffix)) {
    // Extract everything before the domain
    const cleanUsername = username.replace(getConfig().usernameSuffix, "");
    return `@${cleanUsername}`;
  }

  // Return undefined for non-Converse usernames
  return undefined;
}
