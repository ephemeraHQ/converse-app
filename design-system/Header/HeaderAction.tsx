import { IPicto } from "@components/Picto/Picto.types";
import { ReactElement } from "react";
import { TextStyle, View, ViewStyle } from "react-native";
import { translate } from "../../i18n";
import { ThemedStyle, useAppTheme } from "../../theme/useAppTheme";
import { Icon } from "../Icon/Icon";
import { Pressable } from "../Pressable";
import { ITextProps, Text } from "../Text";
import { ITouchableOpacityProps, TouchableOpacity } from "../TouchableOpacity";
import { debugBorder } from "@/utils/debug-style";

type HeaderActionProps = {
  backgroundColor?: string;
  icon?: IPicto;
  iconColor?: string;
  text?: ITextProps["text"];
  tx?: ITextProps["tx"];
  txOptions?: ITextProps["txOptions"];
  onPress?: ITouchableOpacityProps["onPress"];
  ActionComponent?: ReactElement;
  style?: ViewStyle;
};
export function HeaderAction(props: HeaderActionProps) {
  const {
    backgroundColor,
    icon,
    text,
    tx,
    txOptions,
    onPress,
    ActionComponent,
    iconColor,
    style,
  } = props;
  const { themed, theme } = useAppTheme();

  const content = tx ? translate(tx, txOptions) : text;

  if (ActionComponent) return ActionComponent;

  if (content) {
    return (
      <TouchableOpacity
        style={[themed([$actionTextContainer, { backgroundColor }]), style]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.8}
      >
        <Text preset="body" text={content} style={themed($actionText)} />
      </TouchableOpacity>
    );
  }

  if (icon) {
    return (
      <Pressable
        onPress={onPress}
        style={[themed([$actionIconContainer, { backgroundColor }]), style]}
      >
        <Icon size={theme.iconSize.md} icon={icon} color={iconColor} />
      </Pressable>
    );
  }

  return (
    <View
      style={[themed($actionFillerContainer), { backgroundColor }, style]}
    />
  );
}

const $actionTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  paddingHorizontal: spacing.md,
  zIndex: 2,
});

const $actionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});

const $actionIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  // ...debugBorder(),
  flexGrow: 0,
  alignItems: "center",
  justifyContent: "center",
  height: spacing.xxl,
  width: spacing.xxl,
  zIndex: 2,
});

const $actionFillerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: spacing.xxs,
});
