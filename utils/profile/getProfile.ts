import {
  fetchProfileSocialsQuery,
  profileSocialsQueryStorageKey,
} from "@/queries/useProfileSocialsQuery";
import mmkv from "@/utils/mmkv";
import { type IProfileSocials } from "@/features/profiles/profile-types";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import {
  fetchInboxProfileSocialsQuery,
  inboxProfileSocialsQueryStorageKey,
} from "@/queries/useInboxProfileSocialsQuery";

export const getProfileByInboxId = async (
  inboxId: string
  // address: string | undefined
): Promise<IProfileSocials | undefined | null> => {
  const currentInboxId = getCurrentInboxId();
  if (!currentInboxId) {
    return undefined;
  }

  if (inboxId) {
    const addressStorageKey = profileSocialsQueryStorageKey({
      currentInboxId,
      profileLookupInboxId: inboxId,
    });
    const mmkvString = mmkv.getString(addressStorageKey);
    if (mmkvString) {
      return JSON.parse(mmkvString) as IProfileSocials;
    }
  }

  const inboxIdStorageKey = inboxProfileSocialsQueryStorageKey({
    currentInboxId,
    profileLookupInboxId: inboxId,
  });
  const mmkvString = mmkv.getString(inboxIdStorageKey);
  if (mmkvString) {
    return JSON.parse(mmkvString) as IProfileSocials;
  }

  // We don't have any profile data, let's fetch it
  if (inboxId) {
    const profileSocials = await fetchProfileSocialsQuery({
      currentInboxId,
      profileLookupInboxId: inboxId,
    });
    return profileSocials;
  }
  const inboxProfileSocials = await fetchInboxProfileSocialsQuery({
    currentInboxId,
    profileLookupInboxId: inboxId,
  });
  return inboxProfileSocials?.[0];
};
