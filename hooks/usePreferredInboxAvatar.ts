import { getPreferredInboxAvatar } from "@utils/profile";

import { useInboxProfileSocials } from "./useInboxProfileSocials";
import { InboxId } from "@xmtp/react-native-sdk";

export const usePreferredInboxAvatar = (inboxId: InboxId) => {
  const { data } = useInboxProfileSocials(inboxId);
  return getPreferredInboxAvatar(data);
};
