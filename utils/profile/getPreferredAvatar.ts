import { type IProfileSocials } from "@/features/profiles/profile-types";

export function getPreferredAvatar(
  socials: IProfileSocials | undefined | null
): string | undefined {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;

  if (userName) {
    return userName.avatar;
  } else if (ensName) {
    return ensName.avatar;
  }
}
