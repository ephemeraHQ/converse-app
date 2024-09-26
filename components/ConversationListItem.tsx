import { useSelect } from "@data/store/storeHelpers";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import {
  actionSheetColors,
  backgroundColor,
  badgeColor,
  clickedItemBackgroundColor,
  dangerColor,
  inversePrimaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes, PictoSizes } from "@styles/sizes";
import { useConversationListContext } from "@utils/conversationList";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColorSchemeName,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { TouchableRipple } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedRef,
  runOnJS,
} from "react-native-reanimated";

import Avatar from "./Avatar";
import { ConversationContextMenu } from "./ConversationContextMenu";
import GroupAvatar from "./GroupAvatar";
import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { useIsSplitScreen } from "../screens/Navigation/navHelpers";
import { saveTopicsData } from "../utils/api";
import { getMinimalDate } from "../utils/date";
import { isDesktop } from "../utils/device";
import { converseEventEmitter } from "../utils/events";
import { navigate } from "../utils/navigation";
import { consentToPeersOnProtocol } from "../utils/xmtpRN/conversations";

type ConversationListItemProps = {
  colorScheme: ColorSchemeName;
  conversationTime: number | undefined;
  conversationTopic: string;
  conversationName: string;
  conversationPeerAddress: string | undefined;
  conversationPeerAvatar: string | undefined;
  lastMessagePreview: string | undefined;
  lastMessageImageUrl: string | undefined;
  lastMessageFromMe: boolean;
  lastMessageStatus?:
    | "delivered"
    | "error"
    | "seen"
    | "sending"
    | "sent"
    | "prepared";
  showUnread: boolean;
  conversationOpened: boolean;
  isGroupConversation: boolean;
  onRightActionPress?: (defaultAction: () => void) => void;
};

const ConversationListItem = memo(function ConversationListItem({
  colorScheme,
  conversationTopic,
  conversationTime,
  conversationName,
  conversationPeerAddress,
  conversationPeerAvatar,
  lastMessagePreview,
  lastMessageImageUrl,
  lastMessageStatus,
  lastMessageFromMe,
  showUnread,
  conversationOpened,
  isGroupConversation = false,
  onRightActionPress,
}: ConversationListItemProps) {
  const styles = getStyles(colorScheme);
  const timeToShow = getMinimalDate(conversationTime as number);
  const { setTopicsData, setPinnedConversations } = useChatStore(
    useSelect(["setTopicsData", "setPinnedConversations"])
  );
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const isSplitScreen = useIsSplitScreen();
  const [selected, setSelected] = useState(false);
  const resetSelected = useCallback(() => {
    setSelected(false);
  }, []);
  const hasImagePreview = lastMessageImageUrl && lastMessagePreview;
  const showError = lastMessageFromMe && lastMessageStatus === "error";
  const routeName = useConversationListContext("routeName");
  const routeParams = useConversationListContext("routeParams");
  const navigationRef = useConversationListContext("navigationRef");
  const isBlockedChatView = routeName === "Blocked";
  const { allowGroup } = useGroupConsent(conversationTopic, {
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const itemRect = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useAnimatedRef<View>();

  const onLayoutView = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      itemRect.value = { x, y, width, height };
    },
    [itemRect]
  );

  const showContextMenu = useCallback(() => {
    setIsContextMenuVisible(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
  }, []);

  const triggerHapticFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const onLongPress = useCallback(() => {
    runOnJS(triggerHapticFeedback)();
    runOnJS(showContextMenu)();
  }, [triggerHapticFeedback, showContextMenu]);

  const openConversation = useCallback(async () => {
    const getUserAction = async () => {
      const methods = {
        [translate("view_only")]: () => {},
        [translate("view_and_restore")]: () => {
          allowGroup({
            includeCreator: false,
            includeAddedBy: false,
          });
          // Take the user back to wherever the conversation was restored "to"
          // https://github.com/ephemeraHQ/converse-app/issues/315#issuecomment-2312903441
          navigationRef.current?.pop(isSplitScreen ? 1 : 2);
        },
        [translate("cancel")]: () => {},
      };
      const options = Object.keys(methods);

      return new Promise<(() => void) | null>((resolve) => {
        showActionSheetWithOptions(
          {
            options,
            title: translate("view_removed_group_chat"),
            cancelButtonIndex: 2,
            ...actionSheetColors(colorScheme),
          },
          (selectedIndex?: number) => {
            if (
              selectedIndex === undefined ||
              options[selectedIndex] === translate("cancel")
            ) {
              return resolve(null);
            }
            const method = (methods as any)[options[selectedIndex]];
            resolve(method);
          }
        );
      });
    };

    // Ask user's approval when visiting blocked group chats
    if (isGroupConversation && isBlockedChatView) {
      const userAction = await getUserAction();
      if (userAction === null) {
        setSelected(false);
        return; // User canceled, stop further execution
      }
      userAction();
    }

    // Open conversation
    if (routeParams?.frameURL) {
      // Sharing a frame !!
      navigationRef.current?.goBack();
      if (!isSplitScreen) {
        await new Promise((r) =>
          setTimeout(r, Platform.OS === "ios" ? 300 : 20)
        );
      }
      // This handle the case where the conversation is already opened
      converseEventEmitter.emit(
        "setCurrentConversationInputValue",
        routeParams.frameURL
      );
    }
    if (isDesktop) {
      converseEventEmitter.emit("openingConversation", {
        topic: conversationTopic,
      });
    }
    navigate("Conversation", {
      topic: conversationTopic,
      message: routeParams?.frameURL,
    });
  }, [
    isGroupConversation,
    isBlockedChatView,
    routeParams?.frameURL,
    conversationTopic,
    allowGroup,
    navigationRef,
    isSplitScreen,
    colorScheme,
  ]);

  useEffect(() => {
    const navRef = navigationRef.current;
    navRef?.addListener("transitionEnd", resetSelected);
    return () => {
      navRef?.removeListener("transitionEnd", resetSelected);
    };
  }, [navigationRef, resetSelected]);

  const avatarComponent = useMemo(() => {
    return isGroupConversation ? (
      <GroupAvatar
        size={AvatarSizes.conversationListItem}
        style={styles.avatarWrapper}
        uri={conversationPeerAvatar}
        topic={conversationTopic}
        onConversationListScreen
      />
    ) : (
      <Avatar
        size={AvatarSizes.conversationListItem}
        style={styles.avatarWrapper}
        uri={conversationPeerAvatar}
        name={conversationName}
      />
    );
  }, [
    conversationName,
    conversationPeerAvatar,
    conversationTopic,
    isGroupConversation,
    styles.avatarWrapper,
  ]);

  const listItemContent = (
    <View style={styles.conversationListItem}>
      {avatarComponent}
      <View style={styles.messagePreviewContainer}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {conversationName}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {timeToShow} ⋅ {lastMessagePreview}
        </Text>
      </View>
      {hasImagePreview && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: lastMessageImageUrl }}
            style={styles.imagePreview}
            contentFit="cover"
          />
        </View>
      )}
      {(showUnread || showError) && (
        <View style={styles.unreadContainer}>
          <View
            style={[
              styles.unread,
              (!showUnread || showError) && styles.placeholder,
            ]}
          >
            {showError && (
              <Picto
                picto="info.circle"
                color={dangerColor(colorScheme)}
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

  const handleDelete = useCallback(() => {
    if (onRightActionPress) {
      onRightActionPress(closeSwipeable);
      return;
    }

    const showOptions = (
      options: string[],
      title: string,
      actions: (() => void)[]
    ) => {
      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          // Only show red buttons for destructive actions
          destructiveButtonIndex: isBlockedChatView ? undefined : [0, 1],
          title,
          ...actionSheetColors(colorScheme),
        },
        async (selectedIndex?: number) => {
          if (selectedIndex !== undefined && selectedIndex < actions.length) {
            actions[selectedIndex]();
          } else {
            closeSwipeable();
          }
        }
      );
    };

    if (isBlockedChatView) {
      showOptions(
        [translate("unblock_and_restore"), translate("cancel")],
        `${translate("unblock")} ${conversationPeerAddress}?`,
        [
          () => {
            if (!conversationPeerAddress) return;
            consentToPeersOnProtocol(
              currentAccount(),
              [conversationPeerAddress],
              "allow"
            );
            setPeersStatus({ [conversationPeerAddress]: "consented" });
          },
        ]
      );
    } else {
      // for allowed and unknown peer status
      showOptions(
        [
          translate("delete"),
          translate("delete_and_block"),
          translate("cancel"),
        ],
        `${translate("delete_chat_with")} ${conversationPeerAddress}?`,
        [
          () => {
            if (!conversationPeerAddress) return;
            saveTopicsData(currentAccount(), {
              [conversationTopic]: {
                status: "deleted",
                timestamp: new Date().getTime(),
              },
            }),
              setTopicsData({
                [conversationTopic]: {
                  status: "deleted",
                  timestamp: new Date().getTime(),
                },
              });
          },
          () => {
            if (!conversationPeerAddress) return;
            saveTopicsData(currentAccount(), {
              [conversationTopic]: { status: "deleted" },
            });
            setTopicsData({
              [conversationTopic]: {
                status: "deleted",
                timestamp: new Date().getTime(),
              },
            });
            consentToPeersOnProtocol(
              currentAccount(),
              [conversationPeerAddress],
              "deny"
            );
            setPeersStatus({ [conversationPeerAddress]: "blocked" });
          },
        ]
      );
    }
  }, [
    closeSwipeable,
    colorScheme,
    conversationPeerAddress,
    conversationTopic,
    onRightActionPress,
    setPeersStatus,
    setTopicsData,
    isBlockedChatView,
  ]);

  const renderRightActions = useCallback(() => {
    if (isBlockedChatView) {
      return (
        <RectButton style={styles.rightAction} onPress={handleDelete}>
          <Picto
            picto="checkmark"
            color={inversePrimaryColor(colorScheme)}
            size={PictoSizes.swipableItem}
          />
        </RectButton>
      );
    } else {
      return (
        <RectButton style={styles.rightActionRed} onPress={handleDelete}>
          <Picto picto="trash" color="white" size={PictoSizes.swipableItem} />
        </RectButton>
      );
    }
  }, [
    styles.rightAction,
    styles.rightActionRed,
    handleDelete,
    isBlockedChatView,
    colorScheme,
  ]);

  const renderLeftActions = useCallback(() => {
    return (
      <RectButton style={styles.leftAction}>
        <Picto
          picto={showUnread ? "checkmark.message" : "message.badge"}
          color={inversePrimaryColor(colorScheme)}
          size={PictoSizes.swipableItem}
        />
      </RectButton>
    );
  }, [showUnread, styles.leftAction, colorScheme]);

  const contextMenuItems = useMemo(
    () => [
      {
        title: translate("pin"),
        action: () => {
          setPinnedConversations([conversationTopic]);
          closeContextMenu();
        },
        id: "pin",
      },
      {
        title: translate("mark_as_unread"),
        action: () => {
          setTopicsData({
            [conversationTopic]: {
              status: "unread",
              timestamp: new Date().getTime(),
            },
          });
          closeContextMenu();
        },
        id: "markAsUnread",
      },
      {
        title: translate("delete"),
        action: () => {
          handleDelete();
          closeContextMenu();
        },
        id: "delete",
      },
    ],
    [
      conversationTopic,
      setPinnedConversations,
      setTopicsData,
      handleDelete,
      closeContextMenu,
    ]
  );

  const rowItem = (
    <Animated.View ref={containerRef} onLayout={onLayoutView}>
      {Platform.OS === "ios" || Platform.OS === "web" ? (
        <TouchableHighlight
          underlayColor={clickedItemBackgroundColor(colorScheme)}
          delayPressIn={isDesktop ? 0 : 75}
          onLongPress={onLongPress}
          onPressIn={() => {
            if (!isSplitScreen) return;
            openConversation();
          }}
          onPress={() => {
            if (isSplitScreen) return;
            openConversation();
            setSelected(true);
          }}
          style={{
            backgroundColor:
              selected || (isSplitScreen && conversationOpened)
                ? clickedItemBackgroundColor(colorScheme)
                : backgroundColor(colorScheme),
            height: 76,
          }}
        >
          {listItemContent}
        </TouchableHighlight>
      ) : (
        <TouchableRipple
          unstable_pressDelay={isDesktop || isSplitScreen ? 0 : 75}
          onPressIn={() => {
            if (!isSplitScreen) return;
            openConversation();
          }}
          onPress={() => {
            if (isSplitScreen) return;
            openConversation();
          }}
          onLongPress={onLongPress}
          style={styles.rippleRow}
          rippleColor={clickedItemBackgroundColor(colorScheme)}
        >
          {listItemContent}
        </TouchableRipple>
      )}
    </Animated.View>
  );

  const toggleUnreadStatusOnClose = useRef(false);
  const [swipeableKey, setSwipeableKey] = useState(0);

  return (
    <View style={styles.rowSeparator}>
      <Swipeable
        key={swipeableKey}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        leftThreshold={10000} // Never trigger opening
        overshootFriction={4}
        ref={swipeableRef}
        onSwipeableWillOpen={() => {
          converseEventEmitter.on("conversationList-scroll", closeSwipeable);
        }}
        onSwipeableWillClose={(direction) => {
          converseEventEmitter.off("conversationList-scroll", closeSwipeable);
          if (direction === "left") {
            const translation = swipeableRef.current?.state.rowTranslation;
            if (translation && (translation as any)._value > 100) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
              toggleUnreadStatusOnClose.current = true;
            }
          }
        }}
        onSwipeableClose={(direction) => {
          if (direction === "left" && toggleUnreadStatusOnClose.current) {
            toggleUnreadStatusOnClose.current = false;
            setTopicsData({
              [conversationTopic]: {
                status: showUnread ? "read" : "unread",
                timestamp: new Date().getTime(),
              },
            });
            saveTopicsData(currentAccount(), {
              [conversationTopic]: {
                status: showUnread ? "read" : "unread",
                timestamp: new Date().getTime(),
              },
            });
          }
          if (Platform.OS === "web") {
            setSwipeableKey(new Date().getTime());
          }
        }}
        hitSlop={{ left: isSplitScreen ? 0 : -6 }}
      >
        {rowItem}

        <ConversationContextMenu
          isVisible={isContextMenuVisible}
          onClose={closeContextMenu}
          items={contextMenuItems}
          conversation={{ name: conversationName, lastMessagePreview }}
        />
      </Swipeable>
      {Platform.OS === "ios" && <View style={styles.rowSeparatorMargin} />}
    </View>
  );
});
export default ConversationListItem;

const getStyles = (colorScheme: ColorSchemeName) =>
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
  });
