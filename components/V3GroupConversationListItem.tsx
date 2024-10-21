import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { navigate } from "@utils/navigation";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { Member } from "@xmtp/react-native-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConversationListItem } from "./ConversationListItem/ConversationListItem";
import GroupAvatar from "./GroupAvatar";

type V3GroupConversationListItemProps = {
  topic: string;
};

export function V3GroupConversationListItem({
  topic,
}: V3GroupConversationListItemProps) {
  const group = useConversationListGroupItem(topic);
  const [members, setMembers] = useState<Member[]>([]);
  const memberAddresses = useMemo(() => {
    return members.map((member) => member.addresses[0]);
  }, [members]);
  const data = useProfilesSocials(memberAddresses);
  useEffect(() => {
    if (group?.imageUrlSquare) {
      return;
    }
    const fetchMembers = async () => {
      const start = Date.now();
      const members = await group?.membersList();
      const end = Date.now();
      setMembers(members || []);
      console.log(
        `testing111 finished members ${group?.topic} ${
          end - start
        }ms ${JSON.stringify(members)}`
      );
    };
    fetchMembers();
  }, [group]);

  const onPress = useCallback(() => {
    navigate("Conversation", { topic });
  }, [topic]);

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

  console.log("testing111 memberData", memberData);

  return (
    <ConversationListItem.Container onPress={onPress}>
      <ConversationListItem.Left>
        <GroupAvatar
          size={60}
          pendingGroupMembers={memberData}
          uri={group?.imageUrlSquare}
          style={{ marginRight: 8 }}
        />
      </ConversationListItem.Left>
      <ConversationListItem.Center>
        <ConversationListItem.Title>{group?.name}</ConversationListItem.Title>
        <ConversationListItem.Subtitle>
          Message example heheh aasdpfsadfaad kas dk asdf
        </ConversationListItem.Subtitle>
      </ConversationListItem.Center>
    </ConversationListItem.Container>
  );
}
