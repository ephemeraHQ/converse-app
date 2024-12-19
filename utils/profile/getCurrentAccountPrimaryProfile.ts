import { getCurrentAccount } from "@data/store/accountsStore";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export function getCurrentAccountPrimaryProfile() {
  const userAddress = getCurrentAccount();

  if (!userAddress) {
    return undefined;
  }

  const socials = getProfileSocialsQueryData(userAddress, userAddress);

  if (!socials) {
    return undefined;
  }

  return socials.userNames?.find((e) => e.isPrimary);
}
