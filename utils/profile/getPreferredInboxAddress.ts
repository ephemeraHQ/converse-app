import { type IProfileSocials } from "@/features/profiles/profile-types";

/**
 * Get the preferred address for an inbox.
 * TODO: This will need to change when we support multiple accounts on one inbox.
 * @param socialsArray - An array of profile socials associated to the inbox id.
 * @returns The preferred address for the inbox.
 */
export function getPreferredInboxAddress(
  // todo(lustig) more of this socials typing issues
  socialsArray: IProfileSocials | undefined | null
): string | undefined {
  const socials = socialsArray?.cryptoCurrencyWalletAddresses.ETH[0];
  return socials;
}
