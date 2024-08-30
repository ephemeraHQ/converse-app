import { getPreferredName } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";

export const usePreferredName = (peerAddress: string) => {
  const { data } = useProfileSocials(peerAddress);
  return data ? getPreferredName(data, peerAddress) : peerAddress;
};
