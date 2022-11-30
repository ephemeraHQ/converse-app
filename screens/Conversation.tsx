import {
  Chat,
  defaultTheme,
  MessageType,
} from "../vendor/react-native-chat-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useContext } from "react";

import { NavigationParamList } from "./Navigation";
import { AppContext } from "../store/context";
import { sendMessageToPeer } from "../components/XmtpWebview";

const Conversation = ({
  route,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  const { state, dispatch } = useContext(AppContext);
  const conversation = state.xmtp.conversations[route.params.peerAddress];
  let messages = [] as MessageType.Any[];
  if (conversation) {
    messages = conversation.messages.map((m) => ({
      author: {
        id: m.senderAddress,
      },
      createdAt: m.sent,
      id: m.id,
      text: m.content,
      type: "text",
    }));
  }

  const handleSendPress = useCallback((m: MessageType.PartialText) => {
    sendMessageToPeer(conversation.peerAddress, m.text);
  }, []);

  return (
    <Chat
      messages={messages}
      onSendPress={handleSendPress}
      user={{
        id: state.xmtp.address || "",
      }}
      theme={defaultTheme}
    />
  );
};

export default Conversation;
