import { getPreferredName } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";
import { InboxId } from "@xmtp/react-native-sdk";

export const usePreferredName = ({ inboxId }: { inboxId: InboxId }) => {
  if (!inboxId) {
    throw new Error("[usePreferredName] Inbox ID is required");
  }
  const { data } = useProfileSocials({ inboxId });
  /*todo(lustig) make sure this works*/ return data
    ? getPreferredName(data)
    : "name should be invariant on inbox";
};
