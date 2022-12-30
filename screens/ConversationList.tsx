import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  PlatformColor,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import DisconnectButton from "../components/DisconnectButton";
import ChevronRight from "../components/svgs/chevron.right";
import { AppContext } from "../data/store/context";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Main";

export function conversationListItem(
  navigation: NativeStackNavigationProp<NavigationParamList, "Messages">,
  conversation: XmtpConversation
) {
  let timeToShow = "";
  const lastMessageTime = conversation.messages?.[0]?.sent;
  if (lastMessageTime) {
    const days = differenceInCalendarDays(new Date(), lastMessageTime);
    if (days === 0) {
      timeToShow = format(lastMessageTime, "hh:mm aa");
    } else if (days === 1) {
      timeToShow = "yesterday";
    } else if (days < 7) {
      timeToShow = format(lastMessageTime, "EEEE");
    } else {
      timeToShow = format(lastMessageTime, "yyyy-MM-dd");
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
      underlayColor="#EEE"
    >
      <View style={styles.conversationListItem}>
        <Text style={styles.peerAddress}>{conversationName(conversation)}</Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {conversation.messages?.[0]?.content || ""}
        </Text>
        <View style={styles.timeAndChevron}>
          <Text style={styles.timeText}>{timeToShow}</Text>
          <ChevronRight />
        </View>
      </View>
    </TouchableHighlight>
  );
}

function NewConversationButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("NewConversation");
      }}
    >
      <SFSymbol
        name="square.and.pencil"
        weight="semibold"
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
  const { state } = useContext(AppContext);
  const [orderedConversations, setOrderedConversations] = useState<
    XmtpConversation[]
  >([]);
  useEffect(() => {
    const conversations = Object.values(state.xmtp.conversations).filter(
      (a) => a?.messages?.length > 0 && a?.peerAddress
    );
    conversations.sort((a, b) => b.messages[0].sent - a.messages[0].sent);
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
        headerTitle: "Messages",
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
      renderItem={({ item }) => conversationListItem(navigation, item)}
      keyExtractor={(item) => item.topic}
    />
  );
}

const styles = StyleSheet.create({
  conversationList: {
    flex: 1,
    backgroundColor: "white",
  },
  conversationListItem: {
    height: 77,
    borderBottomWidth: 1,
    borderBottomColor: "#ebebeb",
    paddingTop: 8,
    paddingRight: 17,
    marginLeft: 32,
  },
  peerAddress: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 3,
  },
  messagePreview: {
    fontSize: 15,
    color: "rgba(60, 60, 67, 0.6)",
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
    color: "rgba(60, 60, 67, 0.6)",
  },
});
