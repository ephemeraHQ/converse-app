import { getPreferredName } from "./profile/getPreferredName";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export const getReadableProfile = (address: string) => {
  const socials = getProfileSocialsQueryData(address);
  return getPreferredName(socials ?? {}, address);
};
