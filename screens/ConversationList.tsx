import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React, { useContext } from "react";

import { Text, FlatList, StyleSheet, TouchableHighlight } from "react-native";
import { AppContext } from "../store/context";
import { XmtpConversation } from "../store/reducers";
import { NavigationParamList } from "./Navigation";

function conversationListItem(
  navigation: NativeStackNavigationProp<
    NavigationParamList,
    "ConversationList"
  >,
  userAddress: string,
  item: XmtpConversation
) {
  return (
    <TouchableHighlight
      key={item.peerAddress}
      onPress={() => {
        navigation.navigate("Conversation", {
          peerAddress: item.peerAddress,
        });
      }}
      style={styles.conversationListItem}
      underlayColor="#EEE"
    >
      <Text>{item.peerAddress}</Text>
    </TouchableHighlight>
  );
}

export default function ConversationList({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ConversationList">) {
  const { state } = useContext(AppContext);
  const conversations = Object.values(state.xmtp.conversations);
  const userAddress = state.xmtp.address || "";
  return (
    <FlatList
      style={styles.conversationList}
      data={conversations}
      renderItem={({ item }) =>
        conversationListItem(navigation, userAddress, item)
      }
      keyExtractor={(item) => item.peerAddress}
    />
  );
}

const styles = StyleSheet.create({
  conversationList: {
    flex: 1,
    backgroundColor: "white",
  },
  conversationListItem: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: "#ebebeb",
    alignContent: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
