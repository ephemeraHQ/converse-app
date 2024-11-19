import { useCurrentAccount } from "@data/store/accountsStore";
import { MediaPreview } from "@data/store/chatStore";
import { useConversationQuery } from "@queries/useConversationQuery";
import { navigate } from "@utils/navigation";
import { TextInputWithValue } from "@utils/str";
import {
  ConversationTopic,
  ConversationVersion,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { createContext, useContextSelector } from "use-context-selector";

type ISendMessageParams = {
  text?: string;
  referencedMessageId?: string;
  attachment?: RemoteAttachmentContent;
};

export type IConversationContextType = {
  composerHeightAV: SharedValue<number>;
  conversationNotFound: boolean;
  conversationVersion: ConversationVersion;
  numberOfMessages: number;
  topic?: ConversationTopic;
  inputRef: MutableRefObject<TextInputWithValue | undefined>;
  mediaPreviewRef: MutableRefObject<MediaPreview | undefined>;
  isBlockedPeer: boolean;
  onReadyToFocus: () => void;
  messageToPrefill: string;
  mediaPreviewToPrefill: MediaPreview;
  frameTextInputFocused: boolean;
  setFrameTextInputFocused: (b: boolean) => void;
  tagsFetchedOnceForMessage: MutableRefObject<{
    [messageId: string]: boolean;
  }>;
  sendMessage: (message: ISendMessageParams) => Promise<void>;
};

type IConversationContextProps = {
  children: React.ReactNode;
  topic: ConversationTopic;
  messageToPrefill: string;
};

const ConversationContext = createContext<IConversationContextType>(
  {} as IConversationContextType
);

export const ConversationContextProvider = (
  props: IConversationContextProps
) => {
  const { children, topic } = props;

  const currentAccount = useCurrentAccount()!;

  const { data: conversation } = useConversationQuery(currentAccount, topic);

  const composerHeightAV = useSharedValue(0);

  useEffect(() => {
    const checkActive = async () => {
      if (!conversation) return;
      if (conversation.version === ConversationVersion.GROUP) {
        const isActive = conversation.isGroupActive;
        // If not active leave the screen
        if (!isActive) {
          navigate("Chats");
        }
      }
    };
    checkActive();
  }, [conversation]);

  const sendMessage = useCallback(
    // TODO: use Type Discrimination
    async ({ text, referencedMessageId, attachment }: ISendMessageParams) => {
      if (referencedMessageId) {
        if (attachment) {
          await conversation?.send({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: attachment },
            },
          });
        }
        if (text) {
          await conversation?.send({
            reply: {
              reference: referencedMessageId,
              content: { text },
            },
          });
        }
        return;
      }
      if (attachment) {
        await conversation?.send({
          remoteAttachment: attachment,
        });
      }
      if (text) {
        await conversation?.send(text);
      }
    },
    [conversation]
  );

  const value = useMemo(
    () => ({ sendMessage, composerHeightAV, topic }),
    [sendMessage, composerHeightAV, topic]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = <
  K extends keyof IConversationContextType,
>(
  key: K
) => useContextSelector(ConversationContext, (s) => s[key]);
