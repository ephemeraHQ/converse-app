import { useCurrentAccount } from "@data/store/accountsStore";
import { useProfileSocialsQueries } from "@queries/useProfileSocialsQuery";

/**
 *
 * @param peerAddresses Use multiple peer addresses to get their socials
 * @returns
 */
export const useProfilesSocials = (peerAddresses: string[]) => {
  const currentAccount = useCurrentAccount();
  return useProfileSocialsQueries(currentAccount!, peerAddresses);
};
