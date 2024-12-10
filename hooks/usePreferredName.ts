import { getPreferredName } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";
import { shortAddress } from "@/utils/strings/shortAddress";

export const usePreferredName = (peerAddress: string) => {
  const { data } = useProfileSocials(peerAddress);
  return data ? getPreferredName(data, peerAddress) : shortAddress(peerAddress);
};
