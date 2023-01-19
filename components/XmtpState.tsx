import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { saveConversations, saveMessages, saveNewConversation } from "../data";
import { ActionsType, AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { lastValueInMap } from "../utils/map";
import {
  getXmtpClientFromKeys,
  getConversations,
  getNewConversationMessages,
  streamNewConversations,
  streamAllMessages,
} from "../utils/xmtp";
import { Client, Conversation, DecodedMessage } from "../vendor/xmtp-js/src";
import { InvitationContext } from "../vendor/xmtp-js/src/Invitation";

let conversationsToLoad = 0;
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
  const { state, dispatch } = useContext(AppContext);
  const launchedInitialLoad = useRef(false);

  // On open; opening XMTP session
  useEffect(() => {
    const loadKeys = async () => {
      const keys = await SecureStore.getItemAsync("XMTP_KEYS");
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
        SplashScreen.hideAsync();
      } else {
        console.log("SHOULD SHOW LOGIN");
      }
    };
    loadKeys();
  }, [dispatch]);

  const appState = useRef(AppState.currentState);

  const saveXmtpConversations = useCallback(
    (conversations: Conversation[]) => {
      saveConversations(
        conversations.map((c) => ({
          topic: c.topic,
          peerAddress: c.peerAddress,
          createdAt: c.createdAt.getTime(),
          context: c.context || undefined,
          messages: new Map(),
          lazyMessages: [],
        })),
        dispatch
      );
    },
    [dispatch]
  );

  const saveXmtpMessages = useCallback(
    (messages: DecodedMessage[], conversationTopic: string) => {
      saveMessages(
        messages.map((m) => ({
          id: m.id,
          senderAddress: m.senderAddress,
          sent: m.sent.getTime(),
          content: m.content,
        })),
        conversationTopic,
        dispatch
      );
    },
    [dispatch]
  );

  const refreshConversationList = useCallback(async () => {
    console.log("[XMTP] Refreshing conversation list...");
    const conversations = await getConversations(xmtpClient);
    conversations.forEach((c) => {
      conversationsByTopic[c.topic] = c;
    });
    saveXmtpConversations(conversations);
    console.log("[XMTP] Conversation list refreshed!");
  }, [saveXmtpConversations]);

  const loadNewConversationMessages = useCallback(
    async (conversation: Conversation) => {
      let lastConversationTimestamp = 0;
      const stateConversation = state.xmtp.conversations?.[conversation.topic];
      if (stateConversation && stateConversation.messages?.size > 0) {
        lastConversationTimestamp =
          lastValueInMap(stateConversation.messages)?.sent || 0;
      }
      const newMessages = await getNewConversationMessages(
        conversation,
        lastConversationTimestamp
      );
      if (newMessages.length > 0) {
        console.log(
          `[XMTP] Loaded ${newMessages.length} new messages for conversation ${conversation.topic}`
        );
        saveXmtpMessages(newMessages, conversation.topic);
      }
      if (conversationsToLoad > 0) {
        conversationsToLoad = conversationsToLoad - 1;
        if (conversationsToLoad === 0) {
          dispatch({
            type: XmtpDispatchTypes.XmtpInitialLoad,
          });
          dispatch({
            type: XmtpDispatchTypes.XmtpLoading,
            payload: { loading: false },
          });
        }
      }
    },
    [dispatch, saveXmtpMessages, state.xmtp.conversations]
  );

  const initialSync = useCallback(async () => {
    // First make sure we have all conversation
    // instances available to us
    await refreshConversationList();

    conversationsToLoad = Object.keys(conversationsByTopic).length;
    if (conversationsToLoad === 0) {
      dispatch({
        type: XmtpDispatchTypes.XmtpInitialLoad,
      });
    }
    // Let's load each conversation messages
    for (const topic in conversationsByTopic) {
      const conversation = conversationsByTopic[topic];
      loadNewConversationMessages(conversation);
    }
    // And stream future messages
    streamAllMessages(xmtpClient, (message) =>
      saveXmtpMessages([message], message.contentTopic)
    );
    // Then stream newly created conversations
    streamNewConversations(xmtpClient, (conversation) =>
      handleNewConversation(conversation, dispatch)
    );
  }, [
    dispatch,
    loadNewConversationMessages,
    refreshConversationList,
    saveXmtpMessages,
  ]);

  // When connected, load all conversations
  useEffect(() => {
    const initialLoad = async () => {
      if (state.xmtp.connected && !launchedInitialLoad.current) {
        // Let's launch the "initial load" of messages
        // starting with last timestamp for each convo
        launchedInitialLoad.current = true;
        await initialSync();
      }
    };

    initialLoad();
  }, [state.xmtp.connected, initialSync]);

  const resync = useCallback(async () => {
    dispatch({
      type: XmtpDispatchTypes.XmtpLoading,
      payload: { loading: true },
    });
    await refreshConversationList();
    conversationsToLoad = Object.keys(conversationsByTopic).length;
    if (conversationsToLoad === 0) {
      dispatch({
        type: XmtpDispatchTypes.XmtpLoading,
        payload: { loading: false },
      });
      return;
    }
    // Now let's load missing messages
    await Promise.all(
      Object.values(conversationsByTopic).map((conversation) =>
        loadNewConversationMessages(conversation)
      )
    );
  }, [dispatch, loadNewConversationMessages, refreshConversationList]);

  // On back to active, syncinc missed messages
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          state.xmtp.initialLoadDone
        ) {
          console.log("App is active, reloading data");
          await resync();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [resync, state.xmtp.initialLoadDone]);

  return null;
}
