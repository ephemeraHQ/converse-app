import { getPreferredAvatar } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";

export const usePreferredAvatarUri = (peerAddress: string) => {
  const { data: socials } = useProfileSocials(peerAddress);
  return socials ? getPreferredAvatar(socials) : undefined;
};
