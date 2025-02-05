import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { getPreferredInboxName } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export function usePreferredInboxName({
  inboxId,
}: {
  inboxId: InboxId | undefined;
}) {
  const { data, isLoading } = useInboxProfileSocialsQuery({
    inboxId: inboxId!,
    caller: "usePreferredInboxName",
  });

  const preferredName = useMemo(() => getPreferredInboxName(data), [data]);

  return {
    data: preferredName,
    isLoading,
  };
}
