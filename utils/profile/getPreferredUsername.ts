import { type IProfileSocials } from "@/features/profiles/profile-types";

export function getPreferredUsername(
  socials: IProfileSocials | undefined
): string | undefined {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;
  const unsDomain =
    socials?.unstoppableDomains?.find((d) => d.isPrimary) || null;

  if (userName) {
    return userName.name;
  } else if (ensName) {
    return ensName.name;
  } else if (unsDomain) {
    return unsDomain.domain;
  }
}
