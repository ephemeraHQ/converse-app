import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Center } from "@design-system/Center";
import { HStack } from "@design-system/HStack";
import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { FC } from "react";
import { TextStyle, ViewStyle } from "react-native";
import {
  ContextMenuView,
  ContextMenuViewProps,
} from "react-native-ios-context-menu";

type IConversationListPinnedConversationProps = {
  avatarComponent: React.ReactNode;
  onPress: () => void;
  showUnread: boolean;
  title: string;
  contextMenuProps: ContextMenuViewProps;
};

export const ConversationListPinnedConversation: FC<
  IConversationListPinnedConversationProps
> = ({ avatarComponent, onPress, showUnread, title, contextMenuProps }) => {
  const { themed, theme } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <VStack style={themed($container)}>
        <ContextMenuView
          hitSlop={theme.spacing.xs}
          {...contextMenuProps}
          style={[
            {
              borderRadius: 100,
            },
            contextMenuProps.style,
          ]}
        >
          {avatarComponent}
        </ContextMenuView>
        <HStack style={themed($bottomContainer)}>
          <Text numberOfLines={1} style={themed($text)}>
            {title}
          </Text>
          {showUnread && <Center style={themed($indicator)} />}
        </HStack>
      </VStack>
    </Pressable>
  );
};

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  gap: theme.spacing.xxs,
  justifyContent: "center",
  alignItems: "center",
});

const $bottomContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing.xxxs,
  width: theme.spacing["6xl"],
  paddingHorizontal: theme.spacing.xs,
});

const $indicator: ThemedStyle<ViewStyle> = (theme) => ({
  width: theme.spacing.xxs,
  height: theme.spacing.xxs,
  backgroundColor: theme.colors.text.primary,
  borderRadius: theme.spacing.xxxs,
  paddingLeft: theme.spacing.xxxs,
});

const $text: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.text.secondary,
  textAlign: "center",
  maxWidth: theme.spacing["6xl"],
});
