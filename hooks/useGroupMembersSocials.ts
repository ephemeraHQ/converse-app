import { IProfileSocials } from "@/features/profiles/profile.types";
import { GroupMembersSelectData } from "@/queries/useGroupMembersQuery";
import { getInboxProfileSocialsQueryConfig } from "@/queries/useInboxProfileSocialsQuery";
import { useQueries } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const useGroupMembersSocials = (
  groupMembers: GroupMembersSelectData | undefined
) => {
  const memberInboxIds = useMemo(
    () => groupMembers?.ids.map((m) => m) ?? [],
    [groupMembers]
  );

  const queries = useQueries({
    queries: memberInboxIds.map((inboxId) =>
      getInboxProfileSocialsQueryConfig({ inboxId })
    ),
  });

  const profileMap: Record<InboxId, IProfileSocials[] | null | undefined> = {};
  queries.forEach(({ data: socials }, index) => {
    const memberId = groupMembers?.ids[index];
    if (!memberId) return;
    profileMap[memberId] = socials;
  });
  const mappedData = profileMap;

  return mappedData;
};
