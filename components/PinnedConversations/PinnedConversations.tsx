import { StyleSheet, View } from "react-native";

import { PinnedV2Conversation } from "./PinnedV2Conversation";
import { isGroupTopic } from "@utils/groupUtils/groupId";
import { PinnedV3Conversation } from "./PinnedV3Conversation";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";

type Props = {
  topics?: string[];
};

export const PinnedConversations = ({ topics }: Props) => {
  const currentAccount = useCurrentAccount();
  const { isLoading } = useGroupsConversationListQuery(currentAccount!, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading) return null;

  const pinnedConvos = !topics
    ? []
    : topics?.map((topic) => {
        if (isGroupTopic(topic)) {
          return <PinnedV3Conversation topic={topic} key={topic} />;
        }
        return <PinnedV2Conversation topic={topic} key={topic} />;
      });
  return <View style={styles.container}>{pinnedConvos}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
});
