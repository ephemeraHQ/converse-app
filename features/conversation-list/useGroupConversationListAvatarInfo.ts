import { useConversationListMembersQuery } from "@/queries/useGroupMembersQuery";
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import type { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const useGroupConversationListAvatarInfo = (
  currentAccount: string,
  group?: GroupWithCodecsType
) => {
  const { data: membersData } = useConversationListMembersQuery(
    currentAccount,
    group
  );

  const memberInboxIds = useMemo(() => {
    return membersData?.ids || [];
  }, [membersData]);

  const data = useInboxProfileSocialsQueries(currentAccount, memberInboxIds);

  const memberData = useMemo(
    () =>
      data
        .map(
          ({ data: socials }, index) =>
            socials && {
              inboxId: memberInboxIds[index],
              address: getPreferredInboxAddress(socials) ?? "",
              uri: getPreferredInboxAvatar(socials),
              name: getPreferredInboxName(socials),
            }
        )
        .filter(Boolean) as {
        inboxId: InboxId;
        address: string;
        uri: string | undefined;
        name: string;
      }[],
    [data, memberInboxIds]
  );

  return {
    memberData,
    imageUrlSquare: group?.imageUrlSquare,
  };
};
