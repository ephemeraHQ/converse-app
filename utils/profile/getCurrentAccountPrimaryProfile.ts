import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export function getCurrentAccountPrimaryProfile() {
  const userAddress = getCurrentAccount();

  if (!userAddress) {
    return undefined;
  }

  const socials = getProfileSocialsQueryData(userAddress);

  if (!socials) {
    return undefined;
  }

  return socials.userNames?.find((e) => e.isPrimary);
}
