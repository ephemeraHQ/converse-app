import { useProfileSocialsQueries } from "@/queries/useProfileSocialsQuery";
import logger from "@/utils/logger";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client.types";
import { Group, type InboxId, type Member } from "@xmtp/react-native-sdk";
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
      if (typeof group.members !== "function") {
        logger.error(
          `Group members is not a function instance of group is ${group instanceof Group}`
        );
        return;
      }
      const members = await group.members();
      setMembers(members || []);
    };
    fetchMembers();
  }, [group]);

  const memberAddresses = useMemo(
    () => members?.map((m) => m.addresses[0]) ?? [],
    [members]
  );

  const data = useProfileSocialsQueries(currentAccount, memberAddresses);

  const memberData = useMemo(
    () =>
      data
        .map(
          ({ data: socials }, index) =>
            socials && {
              inboxId: members[index].inboxId,
              address: members[index].addresses[0] ?? "",
              uri: getPreferredAvatar(socials),
              name: getPreferredName(
                socials,
                members[index].addresses[0] ?? ""
              ),
            }
        )
        .filter(Boolean) as {
        inboxId: InboxId;
        address: string;
        uri: string | undefined;
        name: string;
      }[],
    [data, members]
  );

  return {
    memberData,
    imageUrlSquare: group?.imageUrlSquare,
  };
};
