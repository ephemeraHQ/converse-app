import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { Member } from "@xmtp/react-native-sdk";
import { useEffect, useMemo, useState } from "react";
import { Swipeable } from "react-native-gesture-handler";

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
    <Swipeable>
      <HStack>
        <GroupAvatar
          size={60}
          pendingGroupMembers={memberData}
          uri={group?.imageUrlSquare}
          style={{ marginRight: 8 }}
        />
        <Text preset="subheading">{group?.name}</Text>
        {/* <Text preset="subheading">{group?.?.content}</Text> */}
      </HStack>
    </Swipeable>
  );
}
