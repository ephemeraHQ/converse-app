import { type ProfileSocials } from "@data/store/profilesStore";
import { getPreferredAvatar } from "./getPreferredAvatar";

/**
 * Get the preferred avatar for an inbox.
 * TODO: This will need to change when we support multiple accounts on one inbox.
 * @param socialsArray - An array of profile socials associated to the inbox id.
 * @returns The preferred avatar for the inbox.
 */
export function getPreferredInboxAvatar(
  socialsArray: ProfileSocials[] | undefined | null
): string | undefined {
  const socials = socialsArray?.[0];
  return getPreferredAvatar(socials);
}
