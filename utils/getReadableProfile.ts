import { getPreferredName } from "./profile/getPreferredName";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export const getReadableProfile = (account: string, address: string) => {
  const socials = getProfileSocialsQueryData(account, address);
  return getPreferredName(socials ?? {}, address);
};
