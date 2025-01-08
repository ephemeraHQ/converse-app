import { getPreferredName } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";

export const usePreferredName = ({
  inboxId,
}: {
  inboxId: string | undefined;
}) => {
  if (!inboxId) {
    throw new Error("[usePreferredName] Inbox ID is required");
  }
  const { data } = useProfileSocials({ peerInboxId: inboxId! });
  /*todo(lustig) make sure this works*/ return data
    ? getPreferredName(data)
    : "name should be invariant on inbox";
};
