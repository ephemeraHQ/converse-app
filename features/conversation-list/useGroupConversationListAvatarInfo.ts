import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { Member } from "@xmtp/react-native-sdk";
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

  const memberAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const member of members) {
      if (member.addresses[0].toLowerCase() !== currentAccount?.toLowerCase()) {
        addresses.push(member.addresses[0]);
      }
    }
    return addresses;
  }, [members, currentAccount]);

  const data = useProfilesSocials(memberAddresses);

  const memberData: {
    address: string;
    uri?: string;
    name?: string;
  }[] = useMemo(() => {
    return data.map(({ data: socials }, index) =>
      socials
        ? {
            address: memberAddresses[index],
            uri: getPreferredAvatar(socials),
            name: getPreferredName(socials, memberAddresses[index]),
          }
        : {
            address: memberAddresses[index],
            uri: undefined,
            name: memberAddresses[index],
          }
    );
  }, [data, memberAddresses]);

  return {
    memberData,
    imageUrlSquare: group?.imageUrlSquare,
  };
};
