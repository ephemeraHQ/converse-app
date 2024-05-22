import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ColorSchemeName,
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableHighlight,
} from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { TouchableRipple } from "react-native-paper";

import Checkmark from "../assets/checkmark.svg";
import Clock from "../assets/clock.svg";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { useIsSplitScreen } from "../screens/Navigation/navHelpers";
import { saveTopicsData } from "../utils/api";
import {
  actionSecondaryColor,
  actionSheetColors,
  backgroundColor,
  badgeColor,
  clickedItemBackgroundColor,
  dangerColor,
  listItemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getRelativeDateTime } from "../utils/date";
import { isDesktop } from "../utils/device";
import { converseEventEmitter } from "../utils/events";
import { navigate } from "../utils/navigation";
import { consentToPeersOnProtocol } from "../utils/xmtpRN/conversations";
import Avatar from "./Avatar";
import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

type ConversationListItemProps = {
  colorScheme: ColorSchemeName;
  conversationTime: number | undefined;
  conversationTopic: string;
  conversationName: string;
  conversationPeerAddress: string;
  conversationPeerAvatar: string | undefined;
  lastMessagePreview: string | undefined;
  lastMessageFromMe: boolean;
  lastMessageStatus?: "delivered" | "error" | "seen" | "sending" | "sent";
  showUnread: boolean;
  conversationOpened: boolean;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "ChatsRequests"
>;

const ConversationListItem = memo(function ConversationListItem({
  navigation,
  route,
  colorScheme,
  conversationTopic,
  conversationTime,
  conversationName,
  conversationPeerAddress,
  conversationPeerAvatar,
  lastMessagePreview,
  lastMessageStatus,
  lastMessageFromMe,
  showUnread,
  conversationOpened,
}: ConversationListItemProps) {
  const styles = getStyles(colorScheme);
  const timeToShow = getRelativeDateTime(conversationTime);
  const setTopicsData = useChatStore((s) => s.setTopicsData);
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const isSplitScreen = useIsSplitScreen();
  const [selected, setSelected] = useState(false);
  const resetSelected = useCallback(() => {
    setSelected(false);
  }, []);

  const openConversation = useCallback(async () => {
    if (route.params?.frameURL) {
      // Sharing a frame !!
      navigation.goBack();
      if (!isSplitScreen) {
        await new Promise((r) =>
          setTimeout(r, Platform.OS === "ios" ? 300 : 20)
        );
      }
      // This handle the case where the conversation is already opened
      converseEventEmitter.emit(
        "setCurrentConversationInputValue",
        route.params.frameURL
      );
    }
    if (isDesktop) {
      converseEventEmitter.emit("openingConversation", {
        topic: conversationTopic,
      });
    }
    navigate("Conversation", {
      topic: conversationTopic,
      message: route.params?.frameURL,
    });
  }, [conversationTopic, isSplitScreen, navigation, route.params?.frameURL]);

  useEffect(() => {
    navigation.addListener("transitionEnd", resetSelected);
    return () => {
      navigation.removeListener("transitionEnd", resetSelected);
    };
  }, [navigation, resetSelected]);

  const listItemContent = (
    <View style={styles.conversationListItem}>
      <Avatar
        size={Platform.OS === "ios" ? 56 : 47}
        style={styles.avatarWrapper}
        uri={conversationPeerAvatar}
      />
      <View style={styles.conversationListItemContent}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {conversationName}
        </Text>
        {lastMessageFromMe &&
          (lastMessageStatus === "sending" ? (
            <Clock
              style={styles.lastMessageStatus}
              fill={textSecondaryColor(colorScheme)}
              width={12}
              height={12}
            />
          ) : (
            <Checkmark
              style={styles.lastMessageStatus}
              fill={textSecondaryColor(colorScheme)}
              width={10}
              height={10}
            />
          ))}
        <Text style={styles.messagePreview} numberOfLines={2}>
          {lastMessageFromMe ? <View style={{ width: 15 }} /> : undefined}
          {lastMessagePreview}
        </Text>
        <View style={styles.timeAndChevron}>
          <Text style={styles.timeText}>{timeToShow}</Text>
          {Platform.OS === "ios" && (
            <Picto
              picto="chevron.right"
              weight="semibold"
              color={actionSecondaryColor(colorScheme)}
              size={10}
            />
          )}
        </View>
        {showUnread && <View style={styles.unread} />}
      </View>
    </View>
  );

  const swipeableRef = useRef<Swipeable | null>(null);
  const closeSwipeable = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const renderRightActions = useCallback(() => {
    return (
      <RectButton
        style={[styles.rightAction]}
        onPress={() => {
          showActionSheetWithOptions(
            {
              options: ["Delete", "Delete and block", "Cancel"],
              cancelButtonIndex: 2,
              destructiveButtonIndex: [0, 1],
              title: `Delete chat with ${conversationPeerAddress}?`,
              ...actionSheetColors(colorScheme),
            },
            (selectedIndex?: number) => {
              if (selectedIndex === 0) {
                saveTopicsData(currentAccount(), {
                  [conversationTopic]: {
                    status: "deleted",
                    timestamp: new Date().getTime(),
                  },
                });
                setTopicsData({
                  [conversationTopic]: {
                    status: "deleted",
                    timestamp: new Date().getTime(),
                  },
                });
              } else if (selectedIndex === 1) {
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
              } else {
                closeSwipeable();
              }
            }
          );
        }}
      >
        <Picto
          picto="trash"
          color="white"
          size={Platform.OS === "ios" ? 18 : 30}
        />
      </RectButton>
    );
  }, [
    conversationTopic,
    conversationPeerAddress,
    setTopicsData,
    setPeersStatus,
    closeSwipeable,
    colorScheme,
    styles.rightAction,
  ]);

  const renderLeftActions = useCallback(() => {
    return (
      <RectButton style={[styles.leftAction]}>
        <Picto
          picto={showUnread ? "checkmark.message" : "message.badge"}
          color="white"
          size={Platform.OS === "ios" ? 18 : 30}
        />
      </RectButton>
    );
  }, [showUnread, styles.leftAction]);

  const rowItem =
    Platform.OS === "ios" || Platform.OS === "web" ? (
      <TouchableHighlight
        underlayColor={clickedItemBackgroundColor(colorScheme)}
        delayPressIn={isDesktop ? 0 : 75}
        onPressIn={() => {
          if (!isSplitScreen) return;
          openConversation();
        }}
        onPress={() => {
          if (isSplitScreen) return;
          openConversation();
          setSelected(true);
        }}
        style={[
          {
            backgroundColor:
              selected || (isSplitScreen && conversationOpened)
                ? clickedItemBackgroundColor(colorScheme)
                : backgroundColor(colorScheme),
            height: 76,
          },
        ]}
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
        style={styles.rippleRow}
        rippleColor={clickedItemBackgroundColor(colorScheme)}
      >
        {listItemContent}
      </TouchableRipple>
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
      </Swipeable>
      {/* Hide part of the border to mimic margin*/}
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
        height: 77,
        borderBottomWidth: 0.25,
        borderBottomColor: listItemSeparatorColor(colorScheme),
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
    },
    avatarWrapper: {
      marginLeft: 16,
      alignSelf: "center",
    },
    conversationListItemContent: {
      flexGrow: 1,
      flexShrink: 1,
      ...Platform.select({
        default: {
          height: 75.5,
          paddingTop: 7.5,
          paddingRight: 60,
          marginLeft: 12,
        },
        android: {
          height: 72,
          paddingTop: 12,
          paddingLeft: 16,
          paddingRight: 45,
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
          marginRight: 110,
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    messagePreview: {
      color: textSecondaryColor(colorScheme),
      flex: 1,
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
    timeAndChevron: {
      position: "absolute",
      ...Platform.select({
        default: {
          top: 8,
          right: 20,
          flexDirection: "row",
          alignItems: "center",
        },
        android: {
          top: 12,
          right: 24,
        },
      }),
    },
    timeText: {
      color: textSecondaryColor(colorScheme),
      ...Platform.select({
        default: { marginRight: 14, fontSize: 15 },
        android: { fontSize: 11 },
      }),
    },
    unread: {
      position: "absolute",
      ...Platform.select({
        default: {
          width: 18,
          height: 18,
          borderRadius: 18,
          right: 16,
          top: 30,
        },
        android: {
          width: 16,
          height: 16,
          borderRadius: 16,
          right: 24,
          top: 36,
        },
      }),
      backgroundColor: badgeColor(colorScheme),
    },
    lastMessageStatus: {
      position: "absolute",
      ...Platform.select({
        default: {
          left: 0,
          top: 35,
        },
        android: {
          left: 16,
          top: 39,
        },
      }),
    },
    rightAction: {
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
  });
