import { getPreferredInboxName } from "@utils/profile";

import { useInboxProfileSocials } from "./useInboxProfileSocials";
import { InboxId } from "@xmtp/react-native-sdk";

export const usePreferredInboxName = (inboxId: InboxId) => {
  const { data } = useInboxProfileSocials(inboxId);
  return getPreferredInboxName(data);
};
