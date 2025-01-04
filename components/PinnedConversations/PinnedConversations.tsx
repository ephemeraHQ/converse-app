import { HStack } from "@/design-system/HStack";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ViewStyle } from "react-native";
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

  if (isLoading || !topics || topics.length === 0) {
    return null;
  }

  return (
    <HStack style={themed($container)}>
      {topics.map((topic) => (
        <PinnedV3Conversation topic={topic} key={topic} />
      ))}
    </HStack>
  );
};

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  flexWrap: "wrap",
  gap: spacing.md,
  paddingBottom: spacing.xs,
  paddingHorizontal: spacing.md,
});
