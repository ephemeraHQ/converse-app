import { getPreferredInboxName } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useInboxProfileSocialsForCurrentAccount } from "./useInboxProfileSocials";
import { useMemo } from "react";

export function usePreferredInboxName({
  inboxId,
}: {
  inboxId: InboxId | undefined;
}) {
  const { data, isLoading } = useInboxProfileSocialsForCurrentAccount(inboxId);

  const preferredName = useMemo(() => getPreferredInboxName(data), [data]);

  return {
    data: preferredName,
    isLoading,
  };
}
