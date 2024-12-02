import { type ProfileSocials } from "@data/store/profilesStore";

/**
 * Get the preferred address for an inbox.
 * TODO: This will need to change when we support multiple accounts on one inbox.
 * @param socialsArray - An array of profile socials associated to the inbox id.
 * @returns The preferred address for the inbox.
 */
export function getPreferredInboxAddress(
  socialsArray: ProfileSocials[] | undefined | null
): string | undefined {
  const socials = socialsArray?.[0];
  return socials?.address;
}
