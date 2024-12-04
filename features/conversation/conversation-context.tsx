import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationQuery } from "@queries/useConversationQuery";
import { addConversationToConversationListQuery } from "@queries/useV3ConversationListQuery";
import { navigate } from "@utils/navigation";
import { createConversationByAccount } from "@utils/xmtpRN/conversations";
import {
  ConversationId,
  ConversationVersion,
  MessageId,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import React, { useCallback, useEffect, useMemo } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { createContext, useContextSelector } from "use-context-selector";
import {
  updateNewConversation,
  useConversationCurrentPeerAddress,
  useConversationCurrentTopic,
} from "./conversation-service";

export type ISendMessageParams = {
  content: {
    text?: string;
    remoteAttachment?: RemoteAttachmentContent;
  };
  referencedMessageId?: MessageId;
} & (
  | { content: { text: string; remoteAttachment?: RemoteAttachmentContent } }
  | { content: { text?: string; remoteAttachment: RemoteAttachmentContent } }
);

export type IConversationContextType = {
  isAllowedConversation: boolean;
  isBlockedConversation: boolean;
  isLoadingConversationConsent: boolean;
  isNewConversation: boolean;
  conversationNotFound: boolean;
  conversationVersion: ConversationVersion | undefined;
  conversationId: ConversationId | undefined;
  peerAddress: string | undefined;
  composerHeightAV: SharedValue<number>;
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

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversationQuery(currentAccount, topic);

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
    async ({ referencedMessageId, content }: ISendMessageParams) => {
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

        console.log("payload:", payload);

        await conversation?.send(payload);
      };

      if (referencedMessageId) {
        if (content.remoteAttachment) {
          await sendCallback({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: content.remoteAttachment },
            },
          });
        }
        if (content.text) {
          await sendCallback({
            reply: {
              reference: referencedMessageId,
              content: { text: content.text },
            },
          });
        }
        return;
      }

      if (content.remoteAttachment) {
        await sendCallback({
          remoteAttachment: content.remoteAttachment,
        });
      }

      if (content.text) {
        await sendCallback(content.text);
      }
    },
    [conversation, currentAccount, peerAddress]
  );

  const isAllowedConversation = useMemo(() => {
    if (!conversation) {
      return false;
    }
    return conversation.state === "allowed";
  }, [conversation]);

  return (
    <ConversationContext.Provider
      value={{
        composerHeightAV,
        conversationId: conversation?.id,
        conversationNotFound: !conversation && !isLoadingConversation,
        conversationVersion: conversation?.version,
        isAllowedConversation,
        isBlockedConversation: conversation?.state === "denied", // TODO: implement this
        isLoadingConversationConsent: isLoadingConversation,
        isNewConversation: !topic && !!peerAddress,
        peerAddress,
        sendMessage,
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
