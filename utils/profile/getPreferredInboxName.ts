import { type ProfileSocials } from "@data/store/profilesStore";
import { getPreferredName } from "./getPreferredName";
import { getPreferredInboxAddress } from "./getPreferredInboxAddress";

/**
 * Get the preferred name for an inbox.
 * TODO: This will need to change when we support multiple accounts on one inbox.
 * @param socialsArray - An array of profile socials associated to the inbox id.
 * @returns The preferred name for the inbox.
 */
export function getPreferredInboxName(
  socialsArray: ProfileSocials[] | undefined | null
): string {
  const socials = socialsArray?.[0];
  return getPreferredName(
    socials,
    getPreferredInboxAddress(socialsArray) ?? ""
  );
}
