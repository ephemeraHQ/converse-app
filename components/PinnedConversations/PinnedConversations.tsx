import { StyleSheet, View } from "react-native";

import { PinnedV3Conversation } from "./PinnedV3Conversation";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";

type Props = {
  topics?: string[];
};

export const PinnedConversations = ({ topics }: Props) => {
  const currentAccount = useCurrentAccount();
  const { isLoading } = useV3ConversationListQuery(
    currentAccount!,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    "PinnedConversations"
  );

  if (isLoading) return null;

  const pinnedConvos = !topics
    ? []
    : topics?.map((topic) => {
        return <PinnedV3Conversation topic={topic} key={topic} />;
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
