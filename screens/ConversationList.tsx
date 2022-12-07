import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";

import { sendMessageToWebview } from "../components/XmtpWebview";
import ChevronRight from "../components/svgs/chevron.right";
import { AppContext } from "../store/context";
import { XmtpConversation } from "../store/reducers";
import { shortAddress } from "../utils/str";
import { NavigationParamList } from "./Navigation";

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
          peerAddress: conversation.peerAddress,
          topic: conversation.topic,
        });
      }}
      underlayColor="#EEE"
    >
      <View style={styles.conversationListItem}>
        <Text style={styles.peerAddress}>
          {shortAddress(conversation.peerAddress)}
        </Text>
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

function AccountDisconnectButton() {
  const { state } = useContext(AppContext);
  const { showActionSheetWithOptions } = useActionSheet();
  return (
    <View style={{ marginLeft: -8 }}>
      <Button
        onPress={() => {
          const destructiveButtonIndex = 0;
          const cancelButtonIndex = 1;

          showActionSheetWithOptions(
            {
              options: ["Disconnect", "Cancel"],
              cancelButtonIndex,
              destructiveButtonIndex,
              title: state.xmtp.address,
            },
            (selectedIndex?: number) => {
              switch (selectedIndex) {
                case destructiveButtonIndex:
                  sendMessageToWebview("DISCONNECT");
                  break;

                default:
                  break;
              }
            }
          );
        }}
        title={shortAddress(state.xmtp.address || "")}
      />
    </View>
  );
}

export default function ConversationList({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const { state } = useContext(AppContext);
  const [orderedConversations, setOrderedConversations] = useState<
    XmtpConversation[]
  >([]);
  useEffect(() => {
    const conversations = Object.values(state.xmtp.conversations).filter(
      (a) => a?.messages?.length > 0
    );
    conversations.sort((a, b) => b.messages[0].sent - a.messages[0].sent);
    setOrderedConversations(conversations);
  }, [state.xmtp.lastUpdateAt]);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        state.xmtp.connected ? <AccountDisconnectButton /> : null,
    });
  }, [state.xmtp.connected]);
  useEffect(() => {
    if (state.xmtp.conversationsLoaded) {
      navigation.setOptions({
        headerTitle: "Messages",
      });
    } else {
      navigation.setOptions({
        headerTitle: () => <ActivityIndicator />,
      });
    }
  }, [state.xmtp.conversationsLoaded]);
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
