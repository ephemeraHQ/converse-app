import { View, ViewStyle } from "react-native";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { useCurrentAccount } from "@data/store/accountsStore";
import { PinnedV3Conversation } from "./PinnedV3Conversation";

type Props = {
  topics?: string[];
};

export const PinnedConversations = ({ topics }: Props) => {
  const currentAccount = useCurrentAccount();

  const { themed } = useAppTheme();

  const { isLoading } = useConversationListQuery({
    account: currentAccount!,
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
