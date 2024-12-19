import { GroupMembersSelectData } from "@/queries/useGroupMembersQuery";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { useInboxProfilesSocials } from "./useInboxProfilesSocials";

export const useGroupMembersSocials = (
  groupMembers: GroupMembersSelectData | undefined
) => {
  const memberInboxIds = useMemo(
    () => groupMembers?.ids.map((m) => m) ?? [],
    [groupMembers]
  );

  const data = useInboxProfilesSocials(memberInboxIds);

  const mappedData = useMemo(() => {
    const profileMap: Record<InboxId, IProfileSocials[] | null | undefined> =
      {};
    data.forEach(({ data: socials }, index) => {
      const memberId = groupMembers?.ids[index];
      if (!memberId) return;
      profileMap[memberId] = socials;
    });
    return profileMap;
  }, [data, groupMembers]);

  return mappedData;
};
