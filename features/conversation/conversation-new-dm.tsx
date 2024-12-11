import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { getCurrentAccount } from "@/data/store/accountsStore";
import { VStack } from "@/design-system/VStack";
import {
  Composer,
  IComposerSendArgs,
} from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { KeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { NewConversationTitle } from "@/features/conversation/conversation-new-dm-header-title";
import { useRouter } from "@/navigation/useNavigation";
import { updateConversationQueryData } from "@/queries/useConversationQuery";
import { updateConversationWithPeerQueryData } from "@/queries/useConversationWithPeerQuery";
import { updateConversationDataToConversationListQuery } from "@/queries/useV3ConversationListQuery";
import { sentryTrackError } from "@/utils/sentry";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client";
import { createConversationByAccount } from "@/utils/xmtpRN/conversations";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationTopic,
  MessageId,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { memo, useCallback, useEffect } from "react";

export const ConversationNewDm = memo(function ConversationNewDm(props: {
  peerAddress: string;
  textPrefill?: string;
}) {
  const { peerAddress, textPrefill } = props;

  const navigation = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewConversationTitle peerAddress={peerAddress} />,
    });
  }, [peerAddress, navigation]);

  return (
    <ConversationComposerStoreProvider
      storeName={"new-conversation" as ConversationTopic}
      inputValue={textPrefill}
    >
      {/*  TODO: Add empty state */}
      <VStack
        style={{
          flex: 1,
        }}
      />
      <ComposerWrapper peerAddress={peerAddress} />
      <KeyboardFiller />
    </ConversationComposerStoreProvider>
  );
});

const ComposerWrapper = memo(function ComposerWrapper(props: {
  peerAddress: string;
}) {
  const { peerAddress } = props;

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

  const { mutateAsync: sendMessageAsync, status: sendMessageStatus } =
    useMutation({
      mutationFn: async (args: {
        conversation: ConversationWithCodecsType;
        text?: string;
        remoteAttachment?: RemoteAttachmentContent;
        referencedMessageId?: MessageId;
      }) => {
        const { conversation, text, remoteAttachment, referencedMessageId } =
          args;

        if (referencedMessageId) {
          if (remoteAttachment) {
            await conversation.send({
              reply: {
                reference: referencedMessageId,
                content: { remoteAttachment },
              },
            });
          }
          if (text) {
            await conversation.send({
              reply: {
                reference: referencedMessageId,
                content: { text },
              },
            });
          }
          return;
        }

        if (remoteAttachment) {
          await conversation.send({
            remoteAttachment,
          });
        }

        if (text) {
          await conversation.send(text);
        }
      },
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

  const handleSendMessage = useCallback(
    async (args: IComposerSendArgs) => {
      const {
        content: { text, remoteAttachment },
        referencedMessageId,
      } = args;

      try {
        const conversation = await createNewConversationAsync(peerAddress);

        await sendMessageAsync({
          conversation,
          text,
          remoteAttachment,
          referencedMessageId,
        });
      } catch (error) {
        showSnackbar({ message: "Failed to send message" });
        sentryTrackError(error);
      }
    },
    [createNewConversationAsync, peerAddress, sendMessageAsync]
  );

  return <Composer onSend={handleSendMessage} />;
});
