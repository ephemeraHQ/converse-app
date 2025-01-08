import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { TouchableHighlight } from "@/design-system/touchable-highlight";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Icon } from "@design-system/Icon/Icon";
import { IIconName } from "@design-system/Icon/Icon.types";
import { ImageStyle } from "expo-image";
import React, { forwardRef, memo, useCallback } from "react";
import { ViewStyle } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

export type ConversationListItemDumbProps = {
  title?: string;
  subtitle?: string;
  avatarComponent?: React.ReactNode;
  rightIsDestructive?: boolean;
  rightComponent?: React.ReactNode;
  leftActionIcon: IIconName;
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onLeftActionPress?: () => void;
  onWillLeftSwipe?: () => void;
  onRightActionPress?: () => void;
  onWillRightSwipe?: () => void;
  isUnread: boolean;
  showError: boolean;
  showImagePreview: boolean;
  imagePreviewUrl: string | undefined;
};

export const ConversationListItemDumb = memo(
  forwardRef<Swipeable, ConversationListItemDumbProps>(
    function ConversationListItemDumb(
      {
        onRightActionPress,
        onLeftActionPress,
        onPress,
        onLongPress,
        onLeftSwipe,
        onWillLeftSwipe,
        onRightSwipe,
        onWillRightSwipe,
        leftActionIcon,
        isUnread,
        title,
        subtitle,
        avatarComponent,
        showError,
        showImagePreview,
        imagePreviewUrl,
        rightIsDestructive,
      },
      swipeableRef
    ) {
      const { themed, theme } = useAppTheme();
      const { iconSize } = theme;

      const themedInversePrimaryColor = theme.colors.fill.inverted.primary;

      const renderLeftActions = useCallback(() => {
        return (
          <RectButton style={themed($leftAction)}>
            <Icon
              icon={leftActionIcon}
              color={themedInversePrimaryColor}
              size={iconSize.lg}
            />
          </RectButton>
        );
      }, [leftActionIcon, themed, themedInversePrimaryColor, iconSize.lg]);

      const renderRightActions = useCallback(() => {
        if (rightIsDestructive) {
          return (
            <RectButton
              style={themed($rightAction)}
              onPress={onRightActionPress}
            >
              <Icon
                icon="checkmark"
                color={themedInversePrimaryColor}
                size={iconSize.lg}
              />
            </RectButton>
          );
        }

        return (
          <RectButton
            style={themed($rightActionRed)}
            onPress={onRightActionPress}
          >
            <Icon icon="trash" color="white" size={iconSize.lg} />
          </RectButton>
        );
      }, [
        rightIsDestructive,
        themed,
        onRightActionPress,
        themedInversePrimaryColor,
        iconSize.lg,
      ]);

      const onSwipeableWillClose = useCallback(
        (direction: "left" | "right") => {
          if (direction === "left") {
            onWillLeftSwipe?.();
          } else {
            onWillRightSwipe?.();
          }
        },
        [onWillLeftSwipe, onWillRightSwipe]
      );

      const onSwipeableClose = useCallback(
        (direction: "left" | "right") => {
          if (direction === "left") {
            onLeftSwipe?.();
          } else {
            onRightSwipe?.();
          }
        },
        [onLeftSwipe, onRightSwipe]
      );

      return (
        <Swipeable
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          leftThreshold={10000}
          overshootFriction={4}
          ref={swipeableRef}
          onSwipeableWillClose={onSwipeableWillClose}
          onSwipeableClose={onSwipeableClose}
          hitSlop={{ left: -6 }}
        >
          <TouchableHighlight
            // onLongPress={onLongPress}
            onPress={onPress}
            style={themed($touchable)}
          >
            <HStack style={themed($conversationListItem)}>
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
                <Center style={$unreadContainer}>
                  <Center
                    style={[
                      themed($unread),
                      (!isUnread || showError) && themed($placeholder),
                    ]}
                  />
                </Center>
              )}
            </HStack>
          </TouchableHighlight>
        </Swipeable>
      );
    }
  )
);

const $conversationListItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
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

const ACTION_WIDTH = 100;

const $rightAction: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: ACTION_WIDTH,
  alignItems: "center",
  backgroundColor: colors.fill.primary,
  justifyContent: "center",
});

const $rightActionRed: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: ACTION_WIDTH,
  alignItems: "center",
  backgroundColor: colors.fill.caution,
  justifyContent: "center",
});

const $leftAction: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: ACTION_WIDTH,
  alignItems: "center",
  backgroundColor: colors.fill.primary,
  justifyContent: "center",
});

const $imagePreviewContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
};

const $imagePreview: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: spacing["4xl"],
  width: spacing["4xl"],
  borderRadius: spacing.xxxs,
});
