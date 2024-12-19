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
    const addressStorageKey = profileSocialsQueryStorageKey(
      currentAccount,
      address
    );
    const mmkvString = mmkv.getString(addressStorageKey);
    if (mmkvString) {
      return JSON.parse(mmkvString) as IProfileSocials;
    }
  }

  const inboxIdStorageKey = inboxProfileSocialsQueryStorageKey(
    currentAccount,
    inboxId
  );
  const mmkvString = mmkv.getString(inboxIdStorageKey);
  if (mmkvString) {
    return JSON.parse(mmkvString) as IProfileSocials;
  }

  // We don't have any profile data, let's fetch it
  if (address) {
    return fetchProfileSocialsQuery(currentAccount, address);
  }
  const inboxProfileSocials = await fetchInboxProfileSocialsQuery(
    currentAccount,
    inboxId
  );
  return inboxProfileSocials?.[0];
};
