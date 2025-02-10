import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { getPreferredInboxAvatar } from "@utils/profile";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const usePreferredInboxAvatar = (args: {
  inboxId: InboxId | undefined;
}) => {
  const { inboxId } = args;

  const { data, isLoading } = useInboxProfileSocialsQuery({
    inboxId: inboxId!,
    caller: "usePreferredInboxAvatar",
  });

  const preferredAvatar = useMemo(() => getPreferredInboxAvatar(data), [data]);

  return {
    data: preferredAvatar,
    isLoading,
  };
};
