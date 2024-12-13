import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { getCurrentAccount } from "@/data/store/accountsStore";
import { Composer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { KeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { NewConversationTitle } from "@/features/conversation/conversation-new-dm-header-title";
import { ConversationNewDmNoMessagesPlaceholder } from "@/features/conversation/conversation-new-dm-no-messages-placeholder";
import {
  ISendMessageParams,
  sendMessage,
} from "@/features/conversation/hooks/use-send-message";
import { useRouter } from "@/navigation/useNavigation";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import { updateConversationWithPeerQueryData } from "@/queries/useConversationWithPeerQuery";
import { updateConversationDataToConversationListQuery } from "@/queries/useV3ConversationListQuery";
import { sentryTrackError } from "@/utils/sentry";
import { createConversationByAccount } from "@/utils/xmtpRN/conversations";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback, useLayoutEffect } from "react";

export const ConversationNewDm = memo(function ConversationNewDm(props: {
  peerAddress: string;
  textPrefill?: string;
}) {
  const { peerAddress, textPrefill } = props;

  const navigation = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewConversationTitle peerAddress={peerAddress} />,
    });
  }, [peerAddress, navigation]);

  const sendFirstConversationMessage =
    useSendFirstConversationMessage(peerAddress);

  const handleSendWelcomeMessage = useCallback(() => {
    sendFirstConversationMessage({
      content: { text: "👋" },
    });
  }, [sendFirstConversationMessage]);

  return (
    <ConversationComposerStoreProvider
      storeName={"new-conversation" as ConversationTopic}
      inputValue={textPrefill}
    >
      <ConversationNewDmNoMessagesPlaceholder
        peerAddress={peerAddress}
        isBlockedPeer={false} // TODO
        onSendWelcomeMessage={handleSendWelcomeMessage}
      />
      <ConversationComposerContainer>
        <Composer onSend={sendFirstConversationMessage} />
      </ConversationComposerContainer>
      <KeyboardFiller messageContextMenuIsOpen={false} />
    </ConversationComposerStoreProvider>
  );
});

function useSendFirstConversationMessage(peerAddress: string) {
  const {
    mutateAsync: createNewConversationAsync,
    status: createNewConversationStatus,
  } = useMutation({
    mutationFn: async (peerAddress: string) => {
      const currentAccount = getCurrentAccount()!;
      return createConversationByAccount(currentAccount, peerAddress!);
    },
    onSuccess: (newConversation) => {
      const currentAccount = getCurrentAccount()!;

      // Update the conversation with peer query
      updateConversationWithPeerQueryData(
        currentAccount,
        peerAddress,
        newConversation
      );

      // Update the list of conversations
      updateConversationDataToConversationListQuery(
        currentAccount,
        newConversation.topic,
        newConversation
      );

      // Update conversation by topic
      updateConversationQueryData(
        currentAccount,
        newConversation.topic,
        newConversation
      );
    },
    // TODO: Add this for optimistic update and faster UX
    // onMutate: (peerAddress) => {
    //   const currentAccount = getCurrentAccount()!;
    //   queryClient.setQueryData<ConversationWithCodecsType>(
    //     conversationWithPeerQueryKey(currentAccount, peerAddress),
    //     () => ({
    //       topic: `RANDOM_TOPIC_${Math.random()}`,
    //     } satisfies DmWithCodecsType)
    //   );
    // },
  });

  const { mutateAsync: sendMessageAsync } = useMutation({
    mutationFn: sendMessage,
    // TODO: Add this for optimistic update and faster UX
    // onMutate: (args) => {
    //   try {
    //     const { conversation } = args;
    //     const currentAccount = getCurrentAccount()!;
    //     addConversationMessage(currentAccount, conversation.topic!, {
    //       id: "RANDOM_MESSAGE_ID",
    //       content: { text: "RANDOM_MESSAGE_TEXT" },
    //     });
    //   } catch (error) {
    //     console.log("error:", error);
    //   }
    // },
  });

  return useCallback(
    async (args: ISendMessageParams) => {
      try {
        // First, create the conversation
        const conversation = await createNewConversationAsync(peerAddress);
        // Then, send the message
        await sendMessageAsync({
          conversation,
          params: args,
        });
      } catch (error) {
        showSnackbar({ message: "Failed to send message" });
        sentryTrackError(error);
      }
    },
    [createNewConversationAsync, peerAddress, sendMessageAsync]
  );
}
