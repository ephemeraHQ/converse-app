import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { getPreferredInboxName } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export function usePreferredInboxName({ inboxId }: { inboxId: InboxId }) {
  const { data, isLoading } = useInboxProfileSocialsQuery({
    inboxId,
  });

  const preferredName = useMemo(() => getPreferredInboxName(data), [data]);

  return {
    data: preferredName,
    isLoading,
  };
}
