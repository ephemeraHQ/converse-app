import { useProfileSocialsQueries } from "@queries/useProfileSocialsQuery";

/**
 * @deprecated Use useInboxProfileSocialsQuery instead
 */
export const useProfilesSocials = (peerAddresses: string[]) => {
  return useProfileSocialsQueries(peerAddresses);
};
