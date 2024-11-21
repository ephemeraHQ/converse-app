import { Platform, TextStyle, ViewStyle } from "react-native";

import { getTitleFontScale } from "@utils/str";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { AnimatedHStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { animations } from "@theme/animations";

type ConversationTitleDumbProps = {
  title?: string;
  avatarComponent?: React.ReactNode;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function ConversationTitleDumb({
  avatarComponent,
  title,
  onLongPress,
  onPress,
}: ConversationTitleDumbProps) {
  const { themed } = useAppTheme();

  return (
    // Add an animation since we are loading certain information and makes it feel faster
    <AnimatedHStack style={$container} entering={animations.fadeInUpSlow()}>
      <TouchableOpacity
        onLongPress={onLongPress}
        onPress={onPress}
        style={themed($touchableContainer)}
      >
        {avatarComponent}
        <Text style={themed($title)} numberOfLines={1} allowFontScaling={false}>
          {title}
        </Text>
      </TouchableOpacity>
    </AnimatedHStack>
  );
}

const $container: ViewStyle = { flexDirection: "row", flexGrow: 1 };

const $touchableContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-start",
  left: Platform.OS === "android" ? -36 : spacing.zero,
  width: "100%",
  alignItems: "center",
  paddingRight: spacing.xxl,
});

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
  fontSize: Platform.OS === "ios" ? 16 * getTitleFontScale() : 18,
});
