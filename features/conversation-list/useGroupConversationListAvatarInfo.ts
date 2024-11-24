import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { InboxId, Member } from "@xmtp/react-native-sdk";
import { useEffect, useMemo, useState } from "react";

export const useGroupConversationListAvatarInfo = (
  currentAccount: string,
  group?: GroupWithCodecsType
) => {
  // TODO: Move this to a query to get persistence
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!group) return;
    if (group?.imageUrlSquare) {
      return;
    }
    const fetchMembers = async () => {
      const members = await group.members();
      setMembers(members || []);
    };
    fetchMembers();
  }, [group]);

  const memberInboxIds = useMemo(() => {
    const inboxIds: InboxId[] = [];
    for (const member of members) {
      if (member.addresses[0].toLowerCase() !== currentAccount?.toLowerCase()) {
        inboxIds.push(member.inboxId);
      }
    }
    return inboxIds;
  }, [members, currentAccount]);

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