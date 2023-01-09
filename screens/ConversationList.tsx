import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ColorSchemeName,
  FlatList,
  PlatformColor,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import DebugButton from "../components/DebugButton";
import DisconnectButton from "../components/DisconnectButton";
import config from "../config";
import { AppContext } from "../data/store/context";
import { XmtpConversation } from "../data/store/xmtpReducer";
import {
  actionSecondaryColor,
  backgroundColor,
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { lastValueInMap } from "../utils/map";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Main";

export function conversationListItem(
  navigation: NativeStackNavigationProp<NavigationParamList, "Messages">,
  conversation: XmtpConversation,
  colorScheme: ColorSchemeName
) {
  const styles = getStyles(colorScheme);
  let timeToShow = "";
  const conversationTime =
    conversation.messages?.size > 0
      ? lastValueInMap(conversation.messages)?.sent
      : conversation.createdAt;
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
  return (
    <TouchableHighlight
      key={conversation.peerAddress}
      onPress={() => {
        navigation.navigate("Conversation", {
          topic: conversation.topic,
        });
      }}
      underlayColor={clickedItemBackgroundColor(colorScheme)}
    >
      <View style={styles.conversationListItem}>
        <Text style={styles.peerAddress}>{conversationName(conversation)}</Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {conversation.messages?.size > 0
            ? lastValueInMap(conversation.messages)?.content
            : ""}
        </Text>
        <View style={styles.timeAndChevron}>
          <Text style={styles.timeText}>{timeToShow}</Text>
          <SFSymbol
            name="chevron.right"
            weight="semibold"
            scale="large"
            color={actionSecondaryColor(colorScheme)}
            size={10}
            resizeMode="center"
            multicolor={false}
          />
        </View>
      </View>
    </TouchableHighlight>
  );
}

function NewConversationButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const debugRef = useRef();
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("NewConversation");
      }}
      onLongPress={() => {
        if (!config.debugMenu || !debugRef.current) {
          return;
        }
        (debugRef.current as any).showDebugMenu();
      }}
    >
      {config.debugMenu && <DebugButton ref={debugRef} />}
      <SFSymbol
        name="square.and.pencil"
        weight="medium"
        scale="large"
        color={PlatformColor("systemBlue")}
        size={16}
        resizeMode="center"
        multicolor={false}
        style={{ width: 32, height: 32 }}
      />
    </TouchableOpacity>
  );
}

export default function ConversationList({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state } = useContext(AppContext);
  const [orderedConversations, setOrderedConversations] = useState<
    XmtpConversation[]
  >([]);
  useEffect(() => {
    const conversations = Object.values(state.xmtp.conversations).filter(
      (a) => a?.peerAddress && a.messages?.size > 0
    );
    conversations.sort((a, b) => {
      const aDate =
        (a.messages?.size > 0
          ? lastValueInMap(a.messages)?.sent
          : a.createdAt) || a.createdAt;
      const bDate =
        (b.messages?.size > 0
          ? lastValueInMap(b.messages)?.sent
          : b.createdAt) || b.createdAt;
      return bDate - aDate;
    });
    setOrderedConversations(conversations);
  }, [state.xmtp.conversations, state.xmtp.lastUpdateAt]);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (state.xmtp.connected ? <DisconnectButton /> : null),
      headerRight: () => (
        <NewConversationButton navigation={navigation} route={route} />
      ),
    });
  }, [navigation, route, state.xmtp.connected]);
  useEffect(() => {
    if (state.xmtp.initialLoadDone && !state.xmtp.loading) {
      navigation.setOptions({
        headerTitle: undefined,
      });
    } else {
      navigation.setOptions({
        headerTitle: () => <ActivityIndicator />,
      });
    }
  }, [navigation, state.xmtp.initialLoadDone, state.xmtp.loading]);
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={styles.conversationList}
      data={orderedConversations}
      renderItem={({ item }) =>
        conversationListItem(navigation, item, colorScheme)
      }
      keyExtractor={(item) => item.topic}
    />
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    conversationList: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    conversationListItem: {
      height: 77,
      borderBottomWidth: 0.25,
      borderBottomColor: listItemSeparatorColor(colorScheme),
      paddingTop: 8,
      paddingRight: 17,
      marginLeft: 32,
    },
    peerAddress: {
      fontSize: 17,
      fontWeight: "600",
      marginBottom: 3,
      color: textPrimaryColor(colorScheme),
    },
    messagePreview: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      flex: 1,
      marginBottom: 8,
    },
    timeAndChevron: {
      position: "absolute",
      top: 8,
      right: 17,
      flexDirection: "row",
      alignItems: "center",
    },
    timeText: {
      marginRight: 14,
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
    },
  });
