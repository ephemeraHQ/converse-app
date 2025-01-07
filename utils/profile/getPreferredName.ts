import { type IProfileSocials } from "@/features/profiles/profile-types";
import { shortAddress } from "@utils/strings/shortAddress";

export function getPreferredName(
  socials: IProfileSocials | undefined | null
): string {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;
  const unsDomain =
    socials?.unstoppableDomains?.find((d) => d.isPrimary) || null;
  const ethAddress1 = socials?.cryptoCurrencyWalletAddresses?.ETH?.[0];

  if (userName) {
    return userName.displayName || userName.name;
  } else if (ensName) {
    return ensName.displayName || ensName.name;
  } else if (unsDomain) {
    return unsDomain.domain;
  } else if (ethAddress1) {
    return shortAddress(ethAddress1);
  } else {
    return "well, we need a name -- how did the user name have a userName";
  }
}
