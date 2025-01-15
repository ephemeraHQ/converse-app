import { AnimatedCenter, Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { TouchableHighlight } from "@/design-system/touchable-highlight";
import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import React, { memo } from "react";
import { ViewStyle } from "react-native";

export type IConversationListItemProps = {
  title?: string;
  subtitle?: string;
  avatarComponent?: React.ReactNode;
  onPress?: () => void;
  isUnread?: boolean;
  showError?: boolean;
};

export const ConversationListItem = memo(function ConversationListItem({
  onPress,
  isUnread,
  title,
  subtitle,
  avatarComponent,
  showError,
}: IConversationListItemProps) {
  const { themed, theme } = useAppTheme();
  const { screenHorizontalPadding } = useConversationListStyles();

  return (
    <TouchableHighlight onPress={onPress} style={themed($touchable)}>
      <HStack
        style={[
          themed($conversationListItem),
          { paddingHorizontal: screenHorizontalPadding },
        ]}
      >
        <Center style={$avatarWrapper}>{avatarComponent}</Center>
        <VStack style={themed($messagePreviewContainer)}>
          <Text preset="bodyBold" weight="medium" numberOfLines={1}>
            {title}
          </Text>
          <Text preset="small" numberOfLines={2} color="secondary">
            {subtitle}
          </Text>
        </VStack>
        {(isUnread || showError) && (
          <AnimatedCenter
            entering={theme.animation.reanimatedFadeInScaleIn()}
            exiting={theme.animation.reanimatedFadeOutScaleOut()}
            style={$unreadContainer}
          >
            <Center
              style={[
                themed($unread),
                (!isUnread || showError) && themed($placeholder),
              ]}
            />
          </AnimatedCenter>
        )}
      </HStack>
    </TouchableHighlight>
  );
});

const $avatarWrapper: ViewStyle = {
  alignSelf: "center",
};

const $messagePreviewContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  flexShrink: 1,
  marginLeft: spacing.xs,
});

const $unreadContainer: ViewStyle = {
  alignItems: "center",
};

const $unread: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: spacing.sm,
  height: spacing.sm,
  borderRadius: spacing.xs,
  backgroundColor: colors.fill.primary,
});

const $touchable: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.surface,
});

const $placeholder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.global.transparent,
});

const $conversationListItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xs,
});
