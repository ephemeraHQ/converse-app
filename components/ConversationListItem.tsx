import { useSelect } from "@data/store/storeHelpers";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import {
  actionSheetColors,
  backgroundColor,
  badgeColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { useConversationListContext } from "@utils/conversationList";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ColorSchemeName,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  useSharedValue,
  useAnimatedRef,
  runOnJS,
} from "react-native-reanimated";

import Avatar from "./Avatar";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { saveTopicsData } from "../utils/api";
import { getMinimalDate } from "../utils/date";
import { converseEventEmitter } from "../utils/events";
import { navigate } from "../utils/navigation";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
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
          navigationRef.current?.pop(2);
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
        return; // User canceled, stop further execution
      }
      userAction();
    }

    // Open conversation
    if (routeParams?.frameURL) {
      // Sharing a frame !!
      navigationRef.current?.goBack();

      await new Promise((r) => setTimeout(r, Platform.OS === "ios" ? 300 : 20));

      // This handle the case where the conversation is already opened
      converseEventEmitter.emit(
        "setCurrentConversationInputValue",
        routeParams.frameURL
      );
    }
    navigate("Conversation", {
      topic: conversationTopic,
      text: routeParams?.frameURL,
    });
  }, [
    isGroupConversation,
    isBlockedChatView,
    routeParams?.frameURL,
    conversationTopic,
    allowGroup,
    navigationRef,
    colorScheme,
  ]);

  const showContextMenu = useCallback(() => {
    setIsContextMenuVisible(true);
  }, []);

  const closeContextMenu = useCallback(
    (openConversationOnClose = false) => {
      setIsContextMenuVisible(false);
      if (openConversationOnClose) {
        openConversation();
      }
    },
    [openConversation]
  );

  const triggerHapticFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const onLongPress = useCallback(() => {
    runOnJS(triggerHapticFeedback)();
    runOnJS(showContextMenu)();
  }, [triggerHapticFeedback, showContextMenu]);

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        size={AvatarSizes.conversationListItem}
        style={styles.avatarWrapper}
        uri={conversationPeerAvatar}
        name={conversationName}
      />
    );
  }, [conversationName, conversationPeerAvatar, styles.avatarWrapper]);

  const swipeableRef = useRef<Swipeable | null>(null);
  const closeSwipeable = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleDelete = useCallback(() => {
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
    setPeersStatus,
    setTopicsData,
    isBlockedChatView,
  ]);

  const toggleReadStatus = useCallback(() => {
    const newStatus = showUnread ? "read" : "unread";
    const timestamp = new Date().getTime();
    setTopicsData({
      [conversationTopic]: {
        status: newStatus,
        timestamp,
      },
    });
    saveTopicsData(currentAccount(), {
      [conversationTopic]: {
        status: newStatus,
        timestamp,
      },
    });
  }, [setTopicsData, conversationTopic, showUnread]);

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
        title: showUnread
          ? translate("mark_as_read")
          : translate("mark_as_unread"),
        action: () => {
          toggleReadStatus();
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
      handleDelete,
      closeContextMenu,
      showUnread,
      toggleReadStatus,
    ]
  );

  const toggleUnreadStatusOnClose = useRef(false);

  const contextMenuComponent = useMemo(
    () => (
      <ConversationContextMenu
        isVisible={isContextMenuVisible}
        onClose={closeContextMenu}
        items={contextMenuItems}
        conversationTopic={conversationTopic}
      />
    ),
    [
      isContextMenuVisible,
      closeContextMenu,
      contextMenuItems,
      conversationTopic,
    ]
  );

  const onWillLeftSwipe = useCallback(() => {
    const translation = swipeableRef.current?.state.rowTranslation;
    if (translation && (translation as any)._value > 100) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      toggleUnreadStatusOnClose.current = true;
    }
  }, []);

  const onLeftSwipe = useCallback(() => {
    toggleUnreadStatusOnClose.current = false;
    toggleReadStatus();
  }, [toggleReadStatus]);

  return (
    <ConversationListItemDumb
      avatarComponent={avatarComponent}
      ref={swipeableRef}
      isUnread={showUnread}
      showError={false}
      showImagePreview={!!hasImagePreview}
      imagePreviewUrl={lastMessageImageUrl}
      title={conversationName}
      subtitle={`${timeToShow} ⋅ ${lastMessagePreview}`}
      onPress={openConversation}
      onRightActionPress={handleDelete}
      onLongPress={onLongPress}
      onWillLeftSwipe={onWillLeftSwipe}
      onLeftSwipe={onLeftSwipe}
      rightIsDestructive={isBlockedChatView}
      contextMenuComponent={contextMenuComponent}
      leftActionIcon={showUnread ? "checkmark.message" : "message.badge"}
    />
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
