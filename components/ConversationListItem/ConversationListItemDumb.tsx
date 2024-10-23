import {
  backgroundColor,
  badgeColor,
  clickedItemBackgroundColor,
  dangerColor,
  inversePrimaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { Image } from "expo-image";
import React, { memo, useCallback, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { TouchableRipple } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedRef,
} from "react-native-reanimated";

import { isDesktop } from "../../utils/device";
import Picto from "../Picto/Picto";

export type ConversationListItemDumbProps = {
  title?: string;
  subtitle?: string;
  avatarComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  renderRightActions: () => React.JSX.Element;
  renderLeftActions: () => React.JSX.Element;
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onLeftActionPress?: () => void;
  onWillLeftSwipe?: () => void;
  onRightActionPress?: (defaultAction: () => void) => void;
  onWillRightSwipe?: () => void;
  contextMenuComponent: React.JSX.Element;
  isUnread: boolean;
  isBlockedChatView: boolean;
  selected: boolean;
  showError: boolean;
  showImagePreview: boolean;
  imagePreviewUrl: string | undefined;
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        rowSeparator: Platform.select({
          android: {},
          default: {
            height: 80,
          },
        }),
        rowSeparatorMargin: {
          position: "absolute",
          width: 84,
          height: 2,
          backgroundColor: backgroundColor(colorScheme),
          bottom: -1.5,
        },
        conversationListItem: {
          flexDirection: "row",
          height: "100%",
          paddingRight: 16,
        },
        avatarWrapper: {
          marginLeft: 16,
          alignSelf: "center",
        },
        messagePreviewContainer: {
          flexGrow: 1,
          flexShrink: 1,
          paddingRight: 16,
          ...Platform.select({
            default: {
              height: 84,
              paddingTop: 12,
              marginLeft: 12,
            },
            android: {
              height: 72,
              paddingTop: 16.5,
              paddingLeft: 16,
            },
          }),
        },
        conversationName: {
          color: textPrimaryColor(colorScheme),
          ...Platform.select({
            default: {
              fontSize: 17,
              fontWeight: "600",
              marginBottom: 3,
            },
            android: {
              fontSize: 16,
            },
          }),
        },
        messagePreview: {
          color: textSecondaryColor(colorScheme),
          ...Platform.select({
            default: {
              fontSize: 15,
              marginBottom: 8,
            },
            android: {
              fontSize: 14,
            },
          }),
        },
        timeText: {
          color: textSecondaryColor(colorScheme),
          ...Platform.select({
            default: { fontSize: 15 },
            web: { marginRight: 14, fontSize: 15 },
            android: { fontSize: 11 },
          }),
        },
        unreadContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          marginLeft: 16,
        },
        unread: {
          width: 14,
          height: 14,
          borderRadius: 16,
          backgroundColor: badgeColor(colorScheme),
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        },
        placeholder: {
          backgroundColor: "transparent",
        },
        rightAction: {
          width: 100,
          alignItems: "center",
          backgroundColor: badgeColor(colorScheme),
          justifyContent: "center",
        },
        rightActionRed: {
          width: 100,
          alignItems: "center",
          backgroundColor: dangerColor(colorScheme),
          justifyContent: "center",
        },
        leftAction: {
          width: 100,
          alignItems: "center",
          backgroundColor: badgeColor(colorScheme),
          justifyContent: "center",
        },
        rippleRow: {
          backgroundColor: backgroundColor(colorScheme),
        },
        imagePreviewContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          marginLeft: 16,
        },
        imagePreview: {
          height: 56,
          width: 56,
          borderRadius: 4,
          aspectRatio: 1,
        },
      }),
    [colorScheme]
  );
};

const useDisplayInfo = () => {
  const colorScheme = useColorScheme();
  const displayRowSeparator = Platform.OS === "ios";
  const themedClickedItemBackgroundColor =
    clickedItemBackgroundColor(colorScheme);
  const themedDangerColor = dangerColor(colorScheme);
  const themedInversePrimaryColor = inversePrimaryColor(colorScheme);
  const themedBackgroundColor = backgroundColor(colorScheme);
  return {
    displayRowSeparator,
    themedClickedItemBackgroundColor,
    themedDangerColor,
    themedInversePrimaryColor,
    themedBackgroundColor,
  };
};

export const ConversationListItemDumb = memo(function ConversationListItemDumb({
  onRightActionPress,
  onLeftActionPress,
  onPress,
  onLongPress,
  onLeftSwipe,
  onWillLeftSwipe,
  onRightSwipe,
  onWillRightSwipe,
  isUnread,
  isBlockedChatView,
  title,
  subtitle,
  avatarComponent,
  contextMenuComponent,
  selected,
  showError,
  showImagePreview,
  imagePreviewUrl,
  renderLeftActions,
}: ConversationListItemDumbProps) {
  const styles = useStyles();
  const {
    displayRowSeparator,
    themedDangerColor,
    themedInversePrimaryColor,
    themedClickedItemBackgroundColor,
    themedBackgroundColor,
  } = useDisplayInfo();

  const itemRect = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useAnimatedRef<View>();

  const onLayoutView = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      itemRect.value = { x, y, width, height };
    },
    [itemRect]
  );

  const listItemContent = (
    <View style={styles.conversationListItem}>
      {avatarComponent}
      <View style={styles.messagePreviewContainer}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {showImagePreview && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: imagePreviewUrl }}
            style={styles.imagePreview}
            contentFit="cover"
          />
        </View>
      )}
      {(isUnread || showError) && (
        <View style={styles.unreadContainer}>
          <View
            style={[
              styles.unread,
              (!isUnread || showError) && styles.placeholder,
            ]}
          >
            {showError && (
              <Picto
                picto="info.circle"
                color={themedDangerColor}
                size={PictoSizes.button}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );

  const swipeableRef = useRef<Swipeable | null>(null);
  const closeSwipeable = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleRightActionPress = useCallback(() => {
    if (onRightActionPress) {
      onRightActionPress(closeSwipeable);
    }
  }, [closeSwipeable, onRightActionPress]);

  const renderRightActions = useCallback(() => {
    if (isBlockedChatView) {
      return (
        <RectButton style={styles.rightAction} onPress={handleRightActionPress}>
          <Picto
            picto="checkmark"
            color={themedInversePrimaryColor}
            size={PictoSizes.swipableItem}
          />
        </RectButton>
      );
    } else {
      return (
        <RectButton
          style={styles.rightActionRed}
          onPress={handleRightActionPress}
        >
          <Picto picto="trash" color="white" size={PictoSizes.swipableItem} />
        </RectButton>
      );
    }
  }, [
    isBlockedChatView,
    styles.rightAction,
    styles.rightActionRed,
    handleRightActionPress,
    themedInversePrimaryColor,
  ]);

  const rowItem = (
    <Animated.View ref={containerRef} onLayout={onLayoutView}>
      {Platform.OS === "ios" || Platform.OS === "web" ? (
        <TouchableHighlight
          underlayColor={themedClickedItemBackgroundColor}
          delayPressIn={isDesktop ? 0 : 75}
          onLongPress={onLongPress}
          onPress={onPress}
          style={{
            backgroundColor: selected
              ? themedClickedItemBackgroundColor
              : themedBackgroundColor,
            height: 76,
          }}
        >
          {listItemContent}
        </TouchableHighlight>
      ) : (
        <TouchableRipple
          unstable_pressDelay={75}
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.rippleRow}
          rippleColor={themedClickedItemBackgroundColor}
        >
          {listItemContent}
        </TouchableRipple>
      )}
    </Animated.View>
  );

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
    <View style={styles.rowSeparator}>
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        leftThreshold={10000} // Never trigger opening
        overshootFriction={4}
        ref={swipeableRef}
        onSwipeableWillClose={onSwipeableWillClose}
        onSwipeableClose={onSwipeableClose}
        hitSlop={{ left: -6 }}
      >
        {rowItem}
        {contextMenuComponent}
      </Swipeable>
      {/* Hide part of the border to mimic margin*/}
      {displayRowSeparator && <View style={styles.rowSeparatorMargin} />}
    </View>
  );
});
