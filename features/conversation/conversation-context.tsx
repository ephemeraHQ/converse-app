import { useDmConsentQuery } from "@/queries/useDmConstentStateQuery";
import { useGroupConsentQuery } from "@/queries/useGroupConsentQuery";
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

type ISendMessageParams = {
  text?: string;
  referencedMessageId?: MessageId;
  attachment?: RemoteAttachmentContent;
};
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

  const { data: groupConsent, isLoading: isLoadingGroupConsent } =
    useGroupConsentQuery(currentAccount, topic!);

  const { data: dmConsent, isLoading: isLoadingDmConsent } = useDmConsentQuery({
    account: currentAccount,
    topic,
  });

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

  const isGroup = conversation?.version === ConversationVersion.GROUP;
  const isDm = conversation?.version === ConversationVersion.DM;

  const isAllowedConversation = useMemo(() => {
    if (!conversation) {
      return false;
    }
    if (isGroup) {
      return groupConsent === "allowed";
    }
    if (isDm) {
      return dmConsent === "allowed";
    }
    return false;
  }, [conversation, dmConsent, groupConsent, isDm, isGroup]);

  return (
    <ConversationContext.Provider
      value={{
        composerHeightAV,
        conversationId: conversation?.id,
        conversationNotFound: !conversation && !isLoadingConversation,
        conversationVersion: conversation?.version,
        isAllowedConversation,
        isBlockedConversation: conversation?.state === "denied", // TODO: implement this
        isLoadingConversationConsent:
          isLoadingGroupConsent || isLoadingDmConsent || isLoadingConversation,
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
