import { useGroupMembersQuery } from "@queries/useGroupMembersQuery";
import { useInboxProfileSocialsQueries } from "@queries/useInboxProfileSocialsQuery";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { ConversationTopic, type InboxId } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

type IMemberInfo = {
  inboxId: InboxId;
  address: string;
  uri: string | undefined;
  name: string;
};

export function useCurrentAccountGroupMembersInfo(args: {
  currentAccount: string;
  groupTopic: ConversationTopic;
}) {
  const { currentAccount, groupTopic } = args;

  const { data: members } = useGroupMembersQuery({
    account: currentAccount,
    topic: groupTopic,
    queryOptions: {
      enabled: Boolean(groupTopic),
    },
  });

  const memberInboxIds = useMemo(() => members?.ids ?? [], [members?.ids]);

  const socialsData = useInboxProfileSocialsQueries(
    currentAccount,
    memberInboxIds
  );

  const groupMembersInfo = useMemo(
    () =>
      socialsData
        .map(({ data: socials }, index): IMemberInfo | null =>
          socials
            ? {
                inboxId: memberInboxIds[index],
                address: getPreferredInboxAddress(socials) ?? "",
                uri: getPreferredInboxAvatar(socials),
                name: getPreferredInboxName(socials),
              }
            : null
        )
        .filter(Boolean) as IMemberInfo[],
    [memberInboxIds, socialsData]
  );

  return {
    groupMembersInfo,
  };
}
