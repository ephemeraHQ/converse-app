import { getPreferredUsername } from "@utils/profile";
import { useProfileSocials } from "./useProfileSocials";
import { InboxId } from "@xmtp/react-native-sdk";

export const usePreferredUsername = ({ inboxId }: { inboxId: InboxId }) => {
  const { data } = useProfileSocials({ inboxId });
  return data ? getPreferredUsername(data) : undefined;
};
