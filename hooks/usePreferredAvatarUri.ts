import { getPreferredAvatar } from "@utils/profile";

import { useProfileSocials } from "./useProfileSocials";

export const usePreferredAvatarUri = ({ inboxId }: { inboxId: string }) => {
  const { data: socials } = useProfileSocials({ peerInboxId: inboxId });
  return socials ? getPreferredAvatar(socials) : undefined;
};
