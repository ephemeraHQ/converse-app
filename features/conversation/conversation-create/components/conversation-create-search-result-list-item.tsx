import { HStack } from "@/design-system/HStack";
import { Pressable } from "@/design-system/Pressable";
import { VStack } from "@/design-system/VStack";
import { $globalStyles } from "@/theme/styles";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { ReactNode } from "react";
import { ViewStyle } from "react-native";

type ConversationSearchResultsListItemProps = {
  avatar?: ReactNode | undefined;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ConversationSearchResultsListItem({
  avatar,
  title,
  subtitle,
  onPress,
}: ConversationSearchResultsListItemProps) {
  const { themed } = useAppTheme();

  return (
    <Pressable onPress={onPress} withHaptics>
      <HStack style={themed($container)}>
        {avatar}
        <VStack style={$globalStyles.flex1}>
          <Text preset="body" numberOfLines={1}>
            {title}
          </Text>
          <Text color="secondary" preset="small" numberOfLines={1}>
            {subtitle}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );
}

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  columnGap: spacing.xs,
});
