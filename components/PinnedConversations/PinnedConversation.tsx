import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { FC } from "react";
import { TextStyle, ViewStyle } from "react-native";
import { HStack } from "@design-system/HStack";
import { Center } from "@design-system/Center";
import { VStack } from "@design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";

type PinnedConversationProps = {
  avatarComponent: React.ReactNode;
  onLongPress: () => void;
  onPress: () => void;
  showUnread: boolean;
  title: string;
};

export const PinnedConversation: FC<PinnedConversationProps> = ({
  avatarComponent,
  onLongPress,
  onPress,
  showUnread,
  title,
}) => {
  const { themed } = useAppTheme();

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <VStack style={themed($container)}>
        {avatarComponent}
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
  width: theme.spacing["6xl"],
});

const $bottomContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing.xxxs,
  width: theme.spacing["6xl"],
});

const $indicator: ThemedStyle<ViewStyle> = (theme) => ({
  width: theme.spacing.xxs,
  height: theme.spacing.xxs,
  backgroundColor: "black",
  borderRadius: theme.spacing.xxxs,
  paddingLeft: theme.spacing.xxxs,
});

const $text: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.text.secondary,
  textAlign: "center",
  flexWrap: "wrap",
  maxWidth: 100,
});
