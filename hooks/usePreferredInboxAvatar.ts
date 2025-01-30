import { getPreferredInboxAvatar } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useInboxProfileSocialsForCurrentAccount } from "./useInboxProfileSocials";
import { useMemo } from "react";

export const usePreferredInboxAvatar = (inboxId: InboxId | undefined) => {
  const { data, isLoading } = useInboxProfileSocialsForCurrentAccount(inboxId);

  const preferredAvatar = useMemo(() => getPreferredInboxAvatar(data), [data]);

  return {
    data: preferredAvatar,
    isLoading,
  };
};
