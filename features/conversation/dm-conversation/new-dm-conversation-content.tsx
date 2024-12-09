import { KeyboardFiller } from "@/components/Conversation/V3Conversation";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { getCurrentAccount } from "@/data/store/accountsStore";
import { VStack } from "@/design-system/VStack";
import {
  Composer,
  IComposerSendArgs,
} from "@/features/conversation/composer/composer";
import { NewConversationTitle } from "@/features/conversations/components/NewConversationTitle";
import { useRouter } from "@/navigation/useNavigation";
import {
  conversationWithPeerQueryKey,
  conversationsQueryKey,
} from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { V3ConversationListType } from "@/queries/useV3ConversationListQuery";
import { sentryTrackError } from "@/utils/sentry";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client";
import { createConversationByAccount } from "@/utils/xmtpRN/conversations";
import { useMutation } from "@tanstack/react-query";
import { MessageId, RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { memo, useCallback, useEffect } from "react";

export const NewDmConversationContent = memo(
  function NewDmConversationContent(props: { peerAddress: string }) {
    const { peerAddress } = props;

    useNewConversationHeader(peerAddress);

    return (
      <>
        {/*  TODO: Add empty state */}
        <VStack
          style={{
            flex: 1,
          }}
        />
        <ComposerWrapper peerAddress={peerAddress} />
        <KeyboardFiller />
      </>
    );
  }
);

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
      queryClient.setQueryData(
        conversationWithPeerQueryKey(currentAccount, peerAddress),
        () => newConversation
      );

      // Update the list of conversations
      queryClient.setQueryData<V3ConversationListType>(
        conversationsQueryKey(currentAccount),
        (conversations) => [...(conversations || []), newConversation]
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
      try {
        const {
          content: { text, remoteAttachment },
          referencedMessageId,
        } = args;
        const newConversation = await createNewConversationAsync(peerAddress);
        await sendMessageAsync({
          conversation: newConversation,
          text,
          remoteAttachment,
          referencedMessageId,
        });
      } catch (error) {
        showSnackbar({
          message: "Failed to send message",
        });
        sentryTrackError(error);
      }
    },
    [sendMessageAsync, peerAddress, createNewConversationAsync]
  );

  return <Composer onSend={handleSendMessage} />;
});

function useNewConversationHeader(peerAddresss: string) {
  const navigation = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewConversationTitle peerAddress={peerAddresss} />,
    });
  }, [peerAddresss, navigation]);
}
