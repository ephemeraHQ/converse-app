import { getPreferredUsername } from "@utils/profile";
import { useProfileSocials } from "./useProfileSocials";

export const usePreferredUsername = ({ inboxId }: { inboxId: string }) => {
  const { data } = useProfileSocials({ inboxId });
  return data ? getPreferredUsername(data) : undefined;
};
