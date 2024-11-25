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
import {
  updateNewConversation,
  useConversationCurrentPeerAddress,
  useConversationCurrentTopic,
} from "./conversation-service";
import { createConversationByAccount } from "@utils/xmtpRN/conversations";
import { addConversationToConversationListQuery } from "@queries/useV3ConversationListQuery";

type ISendMessageParams = {
  text?: string;
  referencedMessageId?: string;
  attachment?: RemoteAttachmentContent;
};

export type IConversationContextType = {
  composerHeightAV: SharedValue<number>;
  conversationNotFound: boolean;
  conversationVersion: ConversationVersion | undefined;
  isNewConversation: boolean;
  peerAddress: string | undefined;
  isBlockedConversation: boolean;
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
  const peerAddress = useConversationCurrentPeerAddress();
  const currentAccount = useCurrentAccount()!;

  const { data: conversation, isLoading } = useConversationQuery(
    currentAccount,
    topic
  );

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
      const sendCallback = async (payload: any) => {
        if (!conversation && !peerAddress) {
          return;
        }
        if (!conversation && peerAddress) {
          const newConversation = await createConversationByAccount(
            currentAccount,
            peerAddress
          );
          updateNewConversation(newConversation.topic);
          await newConversation.send(payload);
          addConversationToConversationListQuery(
            currentAccount,
            newConversation
          );
          return;
        }
        await conversation?.send(payload);
      };

      if (referencedMessageId) {
        if (attachment) {
          await sendCallback({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: attachment },
            },
          });
        }
        if (text) {
          await sendCallback({
            reply: {
              reference: referencedMessageId,
              content: { text },
            },
          });
        }
        return;
      }

      if (attachment) {
        await sendCallback({
          remoteAttachment: attachment,
        });
      }

      if (text) {
        await sendCallback(text);
      }
    },
    [conversation, currentAccount, peerAddress]
  );

  return (
    <ConversationContext.Provider
      value={{
        isNewConversation: !topic && !!peerAddress,
        peerAddress,
        isBlockedConversation: conversation?.state === "denied", // TODO: implement this
        sendMessage,
        composerHeightAV,
        conversationVersion: conversation?.version,
        conversationNotFound: !conversation && !isLoading,
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
