import { getPreferredName } from "@utils/profile";
import { useMemo } from "react";

import { useProfilesSocials } from "./useProfilesSocials";
import { InboxId } from "@xmtp/react-native-sdk";

/**
 * @param peerInboxIds Multiple peer inboxIds to get their socials
 * @returns array of preferred names or the address if not found
 */
export const usePreferredNames = ({
  peerInboxIds,
}: {
  peerInboxIds: InboxId[];
}) => {
  const data = useProfilesSocials({ peerInboxIds });

  const names = useMemo(() => {
    // Not sure how performant this will be, or if we can safely rely on the index
    // If we can't, we should probably use a Map instead
    return data.map(({ data: socials }) => {
      return getPreferredName(socials);
    });
  }, [data]);
  return names;
};
