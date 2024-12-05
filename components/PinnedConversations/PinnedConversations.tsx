import { View, ViewStyle } from "react-native";

import { PinnedV3Conversation } from "./PinnedV3Conversation";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";

type Props = {
  topics?: string[];
};

export const PinnedConversations = ({ topics }: Props) => {
  const currentAccount = useCurrentAccount();

  const { themed } = useAppTheme();

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
  return <View style={themed($container)}>{pinnedConvos}</View>;
};

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: spacing.md,
  paddingBottom: spacing.xs,
  paddingHorizontal: spacing.md,
});
