import { useCurrentAccount } from "@data/store/accountsStore";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { useGroupMembersConversationScreenQuery } from "@queries/useGroupMembersQuery";
import { getPreferredAvatar } from "@utils/profile/getPreferredAvatar";
import { getPreferredName } from "@utils/profile/getPreferredName";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

type UseGroupMembersAvatarDataProps = {
  topic: ConversationTopic;
};

export const useGroupMembersAvatarData = ({
  topic,
}: UseGroupMembersAvatarDataProps) => {
  const currentAccount = useCurrentAccount()!;
  const { data: members, ...query } = useGroupMembersConversationScreenQuery(
    currentAccount,
    topic
  );

  const memberAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const memberId of members?.ids ?? []) {
      const member = members?.byId[memberId];
      if (
        member?.addresses[0] &&
        member?.addresses[0].toLowerCase() !== currentAccount?.toLowerCase()
      ) {
        addresses.push(member?.addresses[0]);
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

  return { data: memberData, ...query };
};
