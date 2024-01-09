import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
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
import Picto from "../components/Picto/Picto";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { useIsSplitScreen } from "../screens/Navigation/navHelpers";
import { deleteTopics } from "../utils/api";
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
import { consentToPeersOnProtocol } from "../utils/xmtpRN/conversations";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

type ConversationListItemProps = {
  navigation: NativeStackNavigationProp<NavigationParamList, "Chats">;
  colorScheme: ColorSchemeName;
  conversationTime: number | undefined;
  conversationTopic: string;
  conversationName: string;
  conversationPeerAddress: string;
  lastMessagePreview: string | undefined;
  lastMessageFromMe: boolean;
  lastMessageStatus?: "delivered" | "error" | "seen" | "sending" | "sent";
  showUnread: boolean;
  conversationOpened: boolean;
};

const ConversationListItem = memo(function ConversationListItem({
  navigation,
  colorScheme,
  conversationTopic,
  conversationTime,
  conversationName,
  conversationPeerAddress,
  lastMessagePreview,
  lastMessageStatus,
  lastMessageFromMe,
  showUnread,
  conversationOpened,
}: ConversationListItemProps) {
  const styles = getStyles(colorScheme);
  const timeToShow = getRelativeDateTime(conversationTime);
  const setTopicsStatus = useChatStore((s) => s.setTopicsStatus);
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const isSplitScreen = useIsSplitScreen();
  const [selected, setSelected] = useState(false);
  const resetSelected = useCallback(() => {
    setSelected(false);
  }, []);
  useEffect(() => {
    navigation.addListener("transitionEnd", resetSelected);
    return () => {
      navigation.removeListener("transitionEnd", resetSelected);
    };
  }, [navigation, resetSelected]);
  const listItemContent = (
    <View style={styles.conversationListItem}>
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
                deleteTopics(currentAccount(), [conversationTopic]);
                setTopicsStatus({ [conversationTopic]: "deleted" });
              } else if (selectedIndex === 1) {
                deleteTopics(currentAccount(), [conversationTopic]);
                setTopicsStatus({ [conversationTopic]: "deleted" });
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
    setTopicsStatus,
    setPeersStatus,
    closeSwipeable,
    colorScheme,
    styles.rightAction,
  ]);

  const rowItem =
    Platform.OS === "ios" ? (
      <TouchableHighlight
        underlayColor={clickedItemBackgroundColor(colorScheme)}
        delayPressIn={isDesktop ? 0 : 75}
        onPressIn={() => {
          if (!isSplitScreen) return;
          Linking.openURL(
            Linking.createURL("/conversation", {
              queryParams: {
                topic: conversationTopic,
              },
            })
          );
        }}
        onPress={() => {
          if (isSplitScreen) return;
          Linking.openURL(
            Linking.createURL("/conversation", {
              queryParams: {
                topic: conversationTopic,
              },
            })
          );
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
        unstable_pressDelay={75}
        onPress={() => {
          navigation.navigate("Conversation", {
            topic: conversationTopic,
          });
        }}
        style={styles.rippleRow}
        rippleColor={clickedItemBackgroundColor(colorScheme)}
      >
        {listItemContent}
      </TouchableRipple>
    );

  return (
    <View style={styles.rowSeparator}>
      <Swipeable
        renderRightActions={renderRightActions}
        overshootFriction={4}
        ref={swipeableRef}
        onSwipeableWillOpen={() => {
          converseEventEmitter.on("conversationList-scroll", closeSwipeable);
        }}
        onSwipeableWillClose={() => {
          converseEventEmitter.off("conversationList-scroll", closeSwipeable);
        }}
        hitSlop={{ left: -60 }}
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
        height: 76.5,
        borderBottomWidth: 0.25,
        borderBottomColor: listItemSeparatorColor(colorScheme),
      },
    }),
    rowSeparatorMargin: {
      position: "absolute",
      width: 30,
      height: 0.5,
      backgroundColor: backgroundColor(colorScheme),
      bottom: -0.25,
    },
    conversationListItem: Platform.select({
      default: {
        height: 75.5,
        paddingTop: 7.5,
        paddingRight: 60,
        marginLeft: 32,
      },
      android: {
        height: 88,
        paddingTop: 12,
        paddingHorizontal: 16,
      },
    }),
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
    rippleRow: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
