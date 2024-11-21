import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationQuery } from "@queries/useConversationQuery";
import { navigate } from "@utils/navigation";
import {
  ConversationVersion,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import React, { useCallback, useEffect } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { createContext, useContextSelector } from "use-context-selector";
import { useConversationCurrentTopic } from "./conversation-service";

type ISendMessageParams = {
  text?: string;
  referencedMessageId?: string;
  attachment?: RemoteAttachmentContent;
};

export type IConversationContextType = {
  composerHeightAV: SharedValue<number>;
  conversationNotFound: boolean;
  conversationVersion: ConversationVersion | undefined;
  isBlockedPeer: boolean;
  sendMessage: (message: ISendMessageParams) => Promise<void>;
};

type IConversationContextProps = {
  children: React.ReactNode;
};

const ConversationContext = createContext<IConversationContextType>(
  {} as IConversationContextType
);

export const ConversationContextProvider = (
  props: IConversationContextProps
) => {
  const { children } = props;

  const topic = useConversationCurrentTopic();
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
    async ({ text, referencedMessageId, attachment }: ISendMessageParams) => {
      if (!conversation) {
        return;
      }

      console.log("referencedMessageId:", referencedMessageId);
      console.log("text:", text);
      console.log("attachment:", attachment);

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

  return (
    <ConversationContext.Provider
      value={{
        isBlockedPeer: false, // TODO: implement this
        sendMessage,
        composerHeightAV,
        conversationVersion: conversation?.version,
        conversationNotFound: !conversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = <
  K extends keyof IConversationContextType,
>(
  key: K
) => useContextSelector(ConversationContext, (s) => s[key]);
