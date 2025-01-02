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
  currentInboxId: string,
  inboxId: InboxId,
  address: string | undefined
): Promise<IProfileSocials | undefined | null> => {
  if (address) {
    const addressStorageKey = profileSocialsQueryStorageKey(
      currentInboxId,
      address
    );
    const mmkvString = mmkv.getString(addressStorageKey);
    if (mmkvString) {
      return JSON.parse(mmkvString) as IProfileSocials;
    }
  }

  const inboxIdStorageKey = inboxProfileSocialsQueryStorageKey(
    currentInboxId,
    inboxId
  );
  const mmkvString = mmkv.getString(inboxIdStorageKey);
  if (mmkvString) {
    return JSON.parse(mmkvString) as IProfileSocials;
  }

  // We don't have any profile data, let's fetch it
  if (address) {
    return fetchProfileSocialsQuery(currentInboxId, address);
  }
  const inboxProfileSocials = await fetchInboxProfileSocialsQuery(
    currentInboxId,
    inboxId
  );
  return inboxProfileSocials?.[0];
};
