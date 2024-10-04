import { ChatPreview } from "@components/Chat/Chat";
import { EmojiPicker } from "@containers/EmojiPicker";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "@data/store/accountsStore";
import { MediaPreview } from "@data/store/chatStore";
import { useSelect } from "@data/store/storeHelpers";
import { backgroundColor, headerTitleStyle } from "@styles/colors";
import { ConversationContext } from "@utils/conversation";
import { setTopicToNavigateTo, topicToNavigateTo } from "@utils/navigation";
import { TextInputWithValue } from "@utils/str";
import { loadOlderMessages } from "@utils/xmtpRN/messages";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

export const ConversationReadOnly: React.FC<{
  topic?: string;
}> = ({ topic }) => {
  const colorScheme = useColorScheme();
  const peersStatus = useSettingsStore((s) => s.peersStatus);
  const [transactionMode, setTransactionMode] = useState(false);
  const [frameTextInputFocused, setFrameTextInputFocused] = useState(false);
  const tagsFetchedOnceForMessage = useRef<{ [messageId: string]: boolean }>(
    {}
  );

  const { conversations, conversationsMapping } = useChatStore(
    useSelect([
      "conversations",
      "conversationsMapping",
      "lastUpdateAt", // Added even if unused to trigger a rerender
    ])
  );

  // Initial conversation topic is be set from the 'topic' prop
  const [_conversationTopic, setConversationTopic] = useState(topic);

  // When we set the conversation topic, we check if it has been mapped
  // to a new one (for pending conversations)
  const conversationTopic =
    _conversationTopic && conversationsMapping[_conversationTopic]
      ? conversationsMapping[_conversationTopic]
      : _conversationTopic;

  // Initial conversation will be set only if topic exists
  const [conversation, setConversation] = useState(
    conversationTopic ? conversations[conversationTopic] : undefined
  );

  // Initial peer address will be set from the conversation object if it exists
  const [peerAddress, setPeerAddress] = useState(
    conversation?.peerAddress || ""
  );

  // When we set the conversation, we set the peer address
  // and preload the local convo for faster sending
  useEffect(() => {
    if (conversation && conversation.peerAddress !== peerAddress) {
      setPeerAddress(conversation.peerAddress || "");
    }
  }, [conversation, peerAddress]);

  // When the conversation topic changes, we set the conversation object
  const conversationTopicRef = useRef(conversationTopic);
  const currentLastUpdateAt = conversation?.lastUpdateAt;
  useEffect(() => {
    if (
      conversationTopic &&
      (conversationTopicRef.current !== conversationTopic ||
        conversations[conversationTopic]?.lastUpdateAt !== currentLastUpdateAt)
    ) {
      const foundConversation = conversations[conversationTopic];
      if (foundConversation) {
        setConversation(foundConversation);
      }
    }
    conversationTopicRef.current = conversationTopic;
  }, [currentLastUpdateAt, conversationTopic, conversations]);

  const isBlockedPeer = useMemo(
    () =>
      conversation?.peerAddress
        ? peersStatus[conversation.peerAddress.toLowerCase()] === "blocked"
        : false,
    [conversation?.peerAddress, peersStatus]
  );

  const textInputRef = useRef<TextInputWithValue>();
  const mediaPreviewRef = useRef<MediaPreview>();

  const messageToPrefill = "";
  const mediaPreviewToPrefill = null;
  const focusOnLayout = useRef(false);
  const chatLayoutDone = useRef(false);
  const alreadyAutomaticallyFocused = useRef(false);

  const onReadyToFocus = useCallback(() => {
    if (alreadyAutomaticallyFocused.current) return;
    if (focusOnLayout.current && !chatLayoutDone.current) {
      chatLayoutDone.current = true;
      alreadyAutomaticallyFocused.current = true;
      textInputRef.current?.focus();
    } else {
      chatLayoutDone.current = true;
    }
  }, []);

  const styles = useStyles();

  useEffect(() => {
    if (conversation) {
      // On load, we mark the conversation as read and as opened
      useChatStore.getState().setOpenedConversationTopic(conversation.topic);

      // On Web this loads them from network, on mobile from local db
      loadOlderMessages(currentAccount(), conversation.topic);

      // If we are navigating to a conversation, we reset the topic to navigate to
      if (topicToNavigateTo === conversation.topic) {
        setTopicToNavigateTo("");
      }
    }
  }, [conversation]);

  return (
    <View style={styles.container} key={`conversation-${colorScheme}`}>
      {conversationTopic ? (
        <ConversationContext.Provider
          value={{
            conversation,
            messageToPrefill,
            inputRef: textInputRef,
            mediaPreviewToPrefill,
            mediaPreviewRef,
            isBlockedPeer,
            onReadyToFocus,
            transactionMode,
            setTransactionMode,
            frameTextInputFocused,
            setFrameTextInputFocused,
            tagsFetchedOnceForMessage,
          }}
        >
          <ChatPreview />
        </ConversationContext.Provider>
      ) : (
        <View style={styles.filler} />
      )}
      <EmojiPicker />
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    title: headerTitleStyle(colorScheme),
    filler: { flex: 1, backgroundColor: backgroundColor(colorScheme) },
  });
};
