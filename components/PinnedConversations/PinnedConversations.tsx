import { View, ViewStyle } from "react-native";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { PinnedV3Conversation } from "./PinnedV3Conversation";
import { useConversationListForCurrentUserQuery } from "@/queries/useConversationListQuery";

type Props = {
  topics?: string[];
};

export const PinnedConversations = ({ topics }: Props) => {
  const { themed } = useAppTheme();

  const { isLoading } = useConversationListForCurrentUserQuery({
    context: "PinnedConversations",
    queryOptions: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

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
