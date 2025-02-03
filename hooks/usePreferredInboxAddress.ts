import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { getPreferredInboxAddress } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const usePreferredInboxAddress = ({
  inboxId,
}: {
  inboxId: InboxId | undefined;
}) => {
  const { data, isLoading } = useInboxProfileSocialsQuery({
    inboxId: inboxId!,
  });

  const preferredAddress = useMemo(() => {
    if (!data) return undefined;
    return getPreferredInboxAddress(data);
  }, [data]);

  return {
    data: preferredAddress,
    isLoading,
  };
};
