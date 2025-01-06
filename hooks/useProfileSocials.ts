import { useProfileSocialsQuery } from "@queries/useProfileSocialsQuery";
import { useCurrentAccountInboxId } from "./use-current-account-inbox-id";

export const useProfileSocials = (peerAccountInboxId: string) => {
  const currentAccountInboxId = useCurrentAccountInboxId();
  return useProfileSocialsQuery({
    accountInboxId: currentAccountInboxId,
    peerAccountInboxId,
  });
};
