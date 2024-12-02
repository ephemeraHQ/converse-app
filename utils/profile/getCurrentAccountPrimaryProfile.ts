import { getCurrentAccount, getProfilesStore } from "@data/store/accountsStore";
import { getProfile } from "./getProfile";

export function getCurrentAccountPrimaryProfile() {
  const userAddress = getCurrentAccount();

  if (!userAddress) {
    return undefined;
  }

  const socials = getProfile(
    userAddress,
    getProfilesStore(userAddress).getState().profiles
  )?.socials;

  if (!socials) {
    return undefined;
  }

  return socials.userNames?.find((e) => e.isPrimary);
}
