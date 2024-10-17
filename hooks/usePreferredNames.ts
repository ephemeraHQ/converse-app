import { getPreferredName } from "@utils/profile";
import { useMemo } from "react";

import { useProfilesSocials } from "./useProfilesSocials";

/**
 *
 * @param peerAddress Multiple peer addresses to get their socials
 * @returns array of preferred names or the address if not found
 */
export const usePreferredNames = (peerAddresses: string[]) => {
  const data = useProfilesSocials(peerAddresses);
  const names = useMemo(() => {
    // Not sure how performant this will be, or if we can safely rely on the index
    // If we can't, we should probably use a Map instead
    return data.map(({ data: socials }, index) => {
      const peerAddress = peerAddresses[index];
      return socials ? getPreferredName(socials, peerAddress) : peerAddress;
    });
  }, [data, peerAddresses]);
  return names;
};
