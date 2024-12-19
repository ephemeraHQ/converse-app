import { getPreferredUsername } from "@utils/profile";
import { useProfileSocials } from "./useProfileSocials";

export const usePreferredUsername = (peerAddress: string) => {
  const { data } = useProfileSocials(peerAddress);
  return data ? getPreferredUsername(data) : undefined;
};
