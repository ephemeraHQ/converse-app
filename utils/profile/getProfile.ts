import {
  fetchProfileSocialsQuery,
  profileSocialsQueryStorageKey,
} from "@/queries/useProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";
import mmkv from "@/utils/mmkv";
import {
  fetchInboxProfileSocialsQuery,
  inboxProfileSocialsQueryStorageKey,
} from "@/queries/useInboxProfileSocialsQuery";
import { type IProfileSocials } from "@/features/profiles/profile-types";

export const getProfile = async (
  currentAccount: string,
  inboxId: InboxId,
  address: string | undefined
): Promise<IProfileSocials | undefined | null> => {
  if (address) {
    const addressStorageKey = profileSocialsQueryStorageKey(address);
    const mmkvString = mmkv.getString(addressStorageKey);
    if (mmkvString) {
      return JSON.parse(mmkvString) as IProfileSocials;
    }
  }

  const inboxIdStorageKey = inboxProfileSocialsQueryStorageKey(inboxId);
  const mmkvString = mmkv.getString(inboxIdStorageKey);
  if (mmkvString) {
    const socials = JSON.parse(mmkvString) as IProfileSocials[];
    return socials[0];
  }

  // We don't have any profile data, let's fetch it
  if (address) {
    const profile = await fetchProfileSocialsQuery(currentAccount, address);
    return profile;
  }

  const inboxProfileSocials = await fetchInboxProfileSocialsQuery(inboxId);

  return inboxProfileSocials?.[0];
};
