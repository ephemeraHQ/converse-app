import { getCurrentInboxId } from "@data/store/accountsStore";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export function getCurrentAccountPrimaryProfile() {
  const currentInboxId = getCurrentInboxId();

  if (!currentInboxId) {
    return undefined;
  }

  const socials = getProfileSocialsQueryData({
    accountInboxId: currentInboxId,
    peerAccountInboxId: currentInboxId,
  });

  if (!socials) {
    return undefined;
  }

  return socials.userNames?.find((e) => e.isPrimary);
}
