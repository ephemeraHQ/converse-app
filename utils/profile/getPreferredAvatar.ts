import { type ProfileSocials } from "@data/store/profilesStore";

export function getPreferredAvatar(
  socials: ProfileSocials | undefined
): string | undefined {
  const userName = socials?.userNames?.find((e) => e.isPrimary) || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary) || null;

  if (userName) {
    return userName.avatar;
  } else if (ensName) {
    return ensName.avatar;
  }
}
