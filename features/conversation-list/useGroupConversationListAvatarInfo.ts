import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { InboxId, Member } from "@xmtp/react-native-sdk";
import { useEffect, useMemo, useState } from "react";

export const useGroupConversationListAvatarInfo = (
  currentAccount: string,
  group?: GroupWithCodecsType
) => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!group) return;
    if (group?.imageUrlSquare) {
      return;
    }
    const fetchMembers = async () => {
      const members = await group?.membersList();
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

  const memberData = useMemo(() => {
    const returnData: {
      inboxId: InboxId;
      address: string;
      uri?: string;
      name?: string;
    }[] = [];
    data.forEach(({ data: socials }, index) => {
      if (socials) {
        returnData.push({
          inboxId: memberInboxIds[index],
          address: socials[0].address ?? "",
          uri: getPreferredAvatar(socials[0]),
          name: getPreferredName(socials[0], socials[0].address ?? ""),
        });
      }
    });
    return returnData;
  }, [data, memberInboxIds]);

  return {
    memberData,
    imageUrlSquare: group?.imageUrlSquare,
  };
};
