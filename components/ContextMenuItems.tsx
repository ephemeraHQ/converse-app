import { VStack } from "@/design-system/VStack";
import { memo, ReactElement } from "react";
import { TextStyle, ViewStyle } from "react-native";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { Pressable } from "@/design-system/Pressable";
import { Icon } from "@/design-system/Icon/Icon";
import { IIconName } from "@/design-system/Icon/Icon.types";
import { iconSize } from "@/theme/icon";

export type ContextMenuItem = {
  id: string;
  title: string;
  action?: () => void;
  leftView?: ReactElement;
  rightView?: ReactElement;
  style?: ViewStyle;
  titleStyle?: TextStyle;
};

export type ContextMenuItemsProps = {
  items: ContextMenuItem[];
  containerStyle?: ViewStyle;
};

export const ContextMenuIcon = ({
  icon,
  color,
}: {
  icon: IIconName;
  color?: string;
}) => {
  return <Icon icon={icon} size={iconSize.sm} color={color} />;
};

export const ContextMenuItems = memo(
  ({ items, containerStyle }: ContextMenuItemsProps) => {
    const { themed } = useAppTheme();

    const sectionContent = items.map((i, index) => (
      <Pressable key={i.id} onPress={i.action}>
        <HStack
          style={[
            themed($defaultRowStyle),
            index === items.length - 1 ? undefined : themed($borderStyle),
            i.style,
          ]}
        >
          {i.leftView}
          <Text
            preset="body"
            style={[themed($defaultTitleStyle), i.titleStyle]}
          >
            {i.title}
          </Text>
          {i.rightView}
        </HStack>
      </Pressable>
    ));
    return (
      <VStack style={themed($defaultContainerStyle)}>{sectionContent}</VStack>
    );
  }
);

const $borderStyle: ThemedStyle<ViewStyle> = (theme) => ({
  borderBottomWidth: theme.borderWidth.sm,
  borderBottomColor: theme.colors.border.subtle,
});

const $defaultRowStyle: ThemedStyle<ViewStyle> = (theme) => ({
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xxs,
  alignItems: "center",
});

const $defaultContainerStyle: ThemedStyle<ViewStyle> = (theme) => ({
  marginVertical: theme.spacing.xxs,
  backgroundColor: theme.colors.background.raised,
  borderRadius: theme.borderRadius.sm,
  width: 180,
});

const $defaultTitleStyle: ThemedStyle<TextStyle> = (theme) => ({
  flex: 1,
});
