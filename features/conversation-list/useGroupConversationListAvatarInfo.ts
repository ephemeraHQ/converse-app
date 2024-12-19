import logger from "@/utils/logger";
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
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

  const memberInboxIds = useMemo(() => {
    return members.map((member) => member.inboxId);
  }, [members]);

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
