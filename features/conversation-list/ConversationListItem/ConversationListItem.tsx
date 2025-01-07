import { HStack } from "@design-system/HStack";
import { Pressable } from "@design-system/Pressable";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type ConversationListItemContainerProps = {
  children: React.ReactNode;
  renderRightActions?: () => React.ReactNode;
  renderLeftActions?: () => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
};

const defaultContainerStyle: ThemedStyle<ViewStyle> = (theme) => ({
  marginHorizontal: theme.spacing.sm,
  marginVertical: theme.spacing.xs,
  flex: 1,
  width: "100%",
});

const ContainerComponent = memo(
  ({
    children,
    renderRightActions,
    renderLeftActions,
    containerStyle,
    onPress,
    onLongPress,
    onLeftSwipe,
    onRightSwipe,
  }: ConversationListItemContainerProps) => {
    const { themed } = useAppTheme();
    const style = containerStyle ?? themed(defaultContainerStyle);
    return (
      <View style={style}>
        <Swipeable
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          leftThreshold={10000}
          overshootFriction={4}
          containerStyle={style}
          onSwipeableWillClose={(direction) => {
            if (direction === "left") {
              onLeftSwipe?.();
            } else {
              onRightSwipe?.();
            }
          }}
        >
          <Pressable onPress={onPress} onLongPress={onLongPress}>
            <HStack>{children}</HStack>
          </Pressable>
        </Swipeable>
      </View>
    );
  }
);

const TitleComponent = memo(({ children }: { children: React.ReactNode }) => {
  return <Text preset="bodyBold">{children}</Text>;
});

const $subtitle: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.text.secondary,
});

const SubtitleComponent = memo(
  ({ children }: { children: React.ReactNode }) => {
    const { themed } = useAppTheme();
    return (
      <Text
        preset="smaller"
        style={themed($subtitle)}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {children}
      </Text>
    );
  }
);

type CenterComponentProps = {
  children: React.ReactNode;
};

const CenterComponent = memo(({ children }: CenterComponentProps) => {
  return <View>{children}</View>;
});

const LeftComponent = memo(({ children }: { children: React.ReactNode }) => {
  return <View>{children}</View>;
});

const AccessoryComponent = memo(
  ({ children }: { children: React.ReactNode }) => {
    return <View>{children}</View>;
  }
);

export const ConversationListItem = {
  // All: PictoTitleSubtitleAll,
  Accessory: AccessoryComponent,
  Left: LeftComponent,
  Center: CenterComponent,
  Container: ContainerComponent,
  Subtitle: SubtitleComponent,
  Title: TitleComponent,
};
