import { useCurrentAccount } from "@/data/store/accountsStore";
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

export function useGroupMembersInfoForCurrentAccount(args: {
  groupTopic: ConversationTopic;
}) {
  const { groupTopic } = args;

  const currentAccount = useCurrentAccount()!;

  const { data: members } = useGroupMembersQuery({
    account: currentAccount,
    topic: groupTopic,
  });

  const memberInboxIds = useMemo(() => members?.ids ?? [], [members?.ids]);

  const socialsData = useInboxProfileSocialsQueries(memberInboxIds);

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
