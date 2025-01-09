import { InboxId } from "@xmtp/react-native-sdk";
import { getPreferredName } from "./profile/getPreferredName";
import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";

export const getReadableProfile = ({
  inboxId,
  profileLookupInboxId,
}: {
  inboxId: InboxId;
  profileLookupInboxId: InboxId;
}) => {
  const socials = getProfileSocialsQueryData({
    currentInboxId: inboxId,
    profileLookupInboxId: profileLookupInboxId,
  });
  return getPreferredName(socials);
};
