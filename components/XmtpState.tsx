import { Client, Conversation } from "@xmtp/xmtp-js";
import { InvitationContext } from "@xmtp/xmtp-js/dist/types/src/Invitation";
import React, { useContext, useEffect } from "react";

import { saveNewConversation } from "../data";
import { ActionsType, AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { loadXmtpKeys } from "../utils/keychain";
import { getXmtpClientFromKeys } from "../utils/xmtp";

let xmtpClient: Client;
const conversationsByTopic: { [topic: string]: Conversation } = {};

export const isOnXmtp = async (address: string) => {
  console.log(xmtpClient);
  return xmtpClient.canMessage(address);
};

export const sendXmtpMessage = async (topic: string, content: string) => {
  const conversation = conversationsByTopic[topic];
  if (!conversation) return;
  const message = await conversation.send(content);
  return message;
};

export const handleNewConversation = (
  conversation: Conversation,
  dispatch: React.Dispatch<ActionsType>
) => {
  conversationsByTopic[conversation.topic] = conversation;
  saveNewConversation(
    {
      topic: conversation.topic,
      peerAddress: conversation.peerAddress,
      createdAt: conversation.createdAt.getTime(),
      context: conversation.context || undefined,
      messages: new Map(),
      lazyMessages: [],
    },
    dispatch
  );
};

export const createNewConversation = async (
  peerAddress: string,
  context: InvitationContext | undefined,
  dispatch: React.Dispatch<ActionsType>
) => {
  const conversation = await xmtpClient.conversations.newConversation(
    peerAddress,
    context
  );
  handleNewConversation(conversation, dispatch);
  return conversation;
};

export default function XmtpState() {
  const { dispatch } = useContext(AppContext);

  // On open; opening XMTP session
  useEffect(() => {
    const loadKeys = async () => {
      const keys = await loadXmtpKeys();
      if (keys) {
        const parsedKeys = JSON.parse(keys);
        xmtpClient = await getXmtpClientFromKeys(parsedKeys);
        dispatch({
          type: XmtpDispatchTypes.XmtpConnected,
          payload: { connected: true },
        });
        dispatch({
          type: XmtpDispatchTypes.XmtpSetAddress,
          payload: { address: xmtpClient.address },
        });
      }
    };
    loadKeys();
  }, [dispatch]);

  return null;
}
