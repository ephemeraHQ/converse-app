import { type IProfileSocials } from "@/features/profiles/profile-types";
import { shortAddress } from "@utils/strings/shortAddress";

export function getPreferredName(
  socials: IProfileSocials | undefined | null,
  peerAddress: string
): string {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;
  const unsDomain =
    socials?.unstoppableDomains?.find((d) => d.isPrimary) || null;

  if (userName) {
    return userName.displayName || userName.name;
  } else if (ensName) {
    return ensName.displayName || ensName.name;
  } else if (unsDomain) {
    return unsDomain.domain;
  }

  return shortAddress(peerAddress);
}
