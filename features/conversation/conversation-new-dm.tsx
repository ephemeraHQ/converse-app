import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { getCurrentInboxId } from "@/data/store/accountsStore";
import { Button } from "@/design-system/Button/Button";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { TouchableWithoutFeedback } from "@/design-system/touchable-without-feedback";
import { Composer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { NewConversationTitle } from "@/features/conversation/conversation-header/conversation-new-dm-header-title";
import { KeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import {
  ISendMessageParams,
  sendMessage,
} from "@/features/conversation/hooks/use-send-message";
import { usePreferredName } from "@/hooks/usePreferredName";
import { translate } from "@/i18n";
import { useRouter } from "@/navigation/useNavigation";
import { addConversationToConversationListQuery } from "@/queries/useConversationListQuery";
import { setDmQueryData } from "@/queries/useDmQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { sentryTrackError } from "@/utils/sentry";
import { createDmForPeerInboxId } from "@/utils/xmtpRN/conversations";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback, useLayoutEffect } from "react";
import { Keyboard } from "react-native";

export const ConversationNewDm = memo(function ConversationNewDm(props: {
  peerInboxId: string;
  textPrefill?: string;
}) {
  const { peerInboxId, textPrefill } = props;

  const navigation = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewConversationTitle peerInboxId={peerInboxId} />,
    });
  }, [peerInboxId, navigation]);

  const sendFirstConversationMessage = useSendFirstConversationMessage({
    peerInboxId,
  });

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
        peerInboxId={peerInboxId}
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

function useSendFirstConversationMessage(args: { peerInboxId: string }) {
  const { mutateAsync: createNewConversationAsync } = useMutation({
    mutationFn: async () => {
      return createDmForPeerInboxId({
        peerInboxId: args.peerInboxId,
      });
    },
    onSuccess: async (newConversation) => {
      const currentInboxId = getCurrentInboxId()!;
      try {
        addConversationToConversationListQuery({
          inboxId: currentInboxId,
          conversation: newConversation,
        });
        setDmQueryData({
          ourInboxId: currentInboxId,
          peerInboxId: args.peerInboxId,
          dm: newConversation,
        });
      } catch (error) {
        captureError(error);
      }
    },
    // TODO: Add this for optimistic update and faster UX
    // onMutate: (peerInboxId) => {
    //   const currentAccount = getCurrentAccount()!;
    //   queryClient.setQueryData<ConversationWithCodecsType>(
    //     conversationWithPeerQueryKey(currentAccount, peerInboxId),
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
        const conversation = await createNewConversationAsync();
        try {
          // Then, send the message
          await sendMessageAsync({
            conversation,
            params: args,
          });
        } catch (error) {
          showSnackbar({ message: "Failed to send message" });
          sentryTrackError(error);
        }
      } catch (error) {
        showSnackbar({ message: "Failed to create conversation" });
        sentryTrackError(error);
      }
    },
    [createNewConversationAsync, sendMessageAsync]
  );
}

type IConversationNewDmNoMessagesPlaceholderProps = {
  peerInboxId: string;
  onSendWelcomeMessage: () => void;
  isBlockedPeer: boolean;
};

function ConversationNewDmNoMessagesPlaceholder(
  args: IConversationNewDmNoMessagesPlaceholderProps
) {
  const { peerInboxId, onSendWelcomeMessage, isBlockedPeer } = args;

  const { theme } = useAppTheme();

  const peerPreferredName = usePreferredName({ inboxId: peerInboxId });

  if (isBlockedPeer) {
    // TODO
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Center
        style={{
          flex: 1,
          flexDirection: "column",
          paddingHorizontal: theme.spacing.md,
          rowGap: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            textAlign: "center",
          }}
        >
          {translate("this_is_the_beginning_of_your_conversation_with", {
            name: peerPreferredName,
          })}
        </Text>
        <Button
          variant="fill"
          icon="hand.wave"
          tx="say_hi"
          onPress={onSendWelcomeMessage}
        />
      </Center>
    </TouchableWithoutFeedback>
  );
}
