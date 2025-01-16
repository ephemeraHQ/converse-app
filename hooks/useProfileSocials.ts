import { useProfileSocialsQuery } from "@queries/useProfileSocialsQuery";

export const useProfileSocials = (peerAddress: string) => {
  return useProfileSocialsQuery(peerAddress);
};
