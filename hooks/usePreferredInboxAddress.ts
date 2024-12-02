import { getPreferredInboxAddress } from "@utils/profile";

import { useInboxProfileSocials } from "./useInboxProfileSocials";
import { InboxId } from "@xmtp/react-native-sdk";

export const usePreferredInboxAddress = (inboxId: InboxId) => {
  const { data } = useInboxProfileSocials(inboxId);
  return getPreferredInboxAddress(data);
};
