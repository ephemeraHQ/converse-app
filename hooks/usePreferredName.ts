import { getPreferredName } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";
import { shortAddress } from "@/utils/strings/shortAddress";

/**
 * @deprecated Use usePreferredInboxName instead
 */
export const usePreferredName = (peerAddress: string) => {
  const { data } = useProfileSocials(peerAddress);
  return data ? getPreferredName(data, peerAddress) : shortAddress(peerAddress);
};
