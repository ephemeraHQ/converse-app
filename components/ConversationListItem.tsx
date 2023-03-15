import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ColorSchemeName,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";

import Picto from "../components/Picto/Picto";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { NavigationParamList } from "../screens/Main";
import {
  actionSecondaryColor,
  backgroundColor,
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";

type ConversationListItemProps = {
  navigation: NativeStackNavigationProp<NavigationParamList, "Messages">;
  conversation: XmtpConversation;
  colorScheme: ColorSchemeName;
  conversationTime: number | undefined;
  conversationTopic: string;
  conversationName: string;
  lastMessagePreview: string | undefined;
};

const ConversationListItem = memo(function ConversationListItem({
  navigation,
  colorScheme,
  conversationTopic,
  conversationTime,
  conversationName,
  lastMessagePreview,
}: ConversationListItemProps) {
  const styles = getStyles(colorScheme);
  let timeToShow = "";
  if (conversationTime) {
    const days = differenceInCalendarDays(new Date(), conversationTime);
    if (days === 0) {
      timeToShow = format(conversationTime, "hh:mm aa");
    } else if (days === 1) {
      timeToShow = "yesterday";
    } else if (days < 7) {
      timeToShow = format(conversationTime, "EEEE");
    } else {
      timeToShow = format(conversationTime, "yyyy-MM-dd");
    }
  }
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
      <View style={styles.conversationListItem}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {conversationName}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
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
      </View>
    </TouchableOpacity>
  );
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
        paddingRight: 17,
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
          right: 17,
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
  });
