import { getPreferredInboxAddress } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { useInboxProfileSocialsForCurrentAccount } from "./useInboxProfileSocials";

export const usePreferredInboxAddress = (inboxId: InboxId) => {
  const { data, isLoading } = useInboxProfileSocialsForCurrentAccount(inboxId);

  const preferredAddress = useMemo(() => {
    if (!data) return undefined;
    return getPreferredInboxAddress(data);
  }, [data]);

  return {
    data: preferredAddress,
    isLoading,
  };
};
