import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ColorSchemeName,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { TouchableRipple } from "react-native-paper";

import Checkmark from "../assets/checkmark.svg";
import Clock from "../assets/clock.svg";
import Picto from "../components/Picto/Picto";
import { XmtpConversation } from "../data/store/chatStore";
import { NavigationParamList } from "../screens/Main";
import {
  actionSecondaryColor,
  backgroundColor,
  badgeColor,
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getRelativeDateTime } from "../utils/date";

type ConversationListItemProps = {
  navigation: NativeStackNavigationProp<NavigationParamList, "Messages">;
  conversation: XmtpConversation;
  colorScheme: ColorSchemeName;
  conversationTime: number | undefined;
  conversationTopic: string;
  conversationName: string;
  lastMessagePreview: string | undefined;
  lastMessageFromMe: boolean;
  lastMessageStatus?: "delivered" | "error" | "seen" | "sending" | "sent";
  showUnread: boolean;
};

const ConversationListItem = memo(function ConversationListItem({
  navigation,
  colorScheme,
  conversationTopic,
  conversationTime,
  conversationName,
  lastMessagePreview,
  lastMessageStatus,
  lastMessageFromMe,
  showUnread,
}: ConversationListItemProps) {
  const styles = getStyles(colorScheme);
  const timeToShow = getRelativeDateTime(conversationTime);
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
  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity
        activeOpacity={1}
        key={conversationTopic}
        onPress={() => {
          navigation.navigate("Conversation", {
            topic: conversationTopic,
          });
          setSelected(true);
        }}
        style={{
          backgroundColor: selected
            ? clickedItemBackgroundColor(colorScheme)
            : backgroundColor(colorScheme),
        }}
      >
        {listItemContent}
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableRipple
        key={conversationTopic}
        unstable_pressDelay={75}
        onPress={() => {
          navigation.navigate("Conversation", {
            topic: conversationTopic,
          });
        }}
        rippleColor={clickedItemBackgroundColor(colorScheme)}
      >
        {listItemContent}
      </TouchableRipple>
    );
  }
});
export default ConversationListItem;

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    conversationListItem: Platform.select({
      default: {
        height: 77,
        borderBottomWidth: 0.25,
        borderBottomColor: listItemSeparatorColor(colorScheme),
        paddingTop: 8,
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
  });
