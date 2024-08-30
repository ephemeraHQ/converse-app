import { useCurrentAccount } from "@data/store/accountsStore";
import { useProfileSocialsQuery } from "@queries/useProfileSocialsQuery";

export const useProfileSocials = (peerAddress: string) => {
  const currentAccount = useCurrentAccount();
  return useProfileSocialsQuery(currentAccount!, peerAddress);
};
