import { useProfileSocialsQuery } from "@queries/useProfileSocialsQuery";

/**
 * @deprecated Use useInboxProfileSocialsQuery instead
 */
export const useProfileSocials = (peerAddress: string) => {
  return useProfileSocialsQuery(peerAddress);
};
