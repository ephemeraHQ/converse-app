import { getCurrentAccountEthAddress } from "@/features/authentication/account.store";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export function getCurrentAccountPrimaryProfile() {
  const userAddress = getCurrentAccountEthAddress();

  if (!userAddress) {
    return undefined;
  }

  const socials = getProfileSocialsQueryData(userAddress);

  if (!socials) {
    return undefined;
  }

  return socials.userNames?.find((e) => e.isPrimary);
}
