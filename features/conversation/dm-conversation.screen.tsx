import {
  KeyboardFiller,
  MessagesList,
} from "@/components/Conversation/V3Conversation";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { VStack } from "@/design-system/VStack";
import { Loader } from "@/design-system/loader";
import {
  Composer,
  IComposerSendArgs,
} from "@/features/conversation/composer/composer";
import { useConversationCurrentTopic } from "@/features/conversation/conversation-service";
import { DmConversationTitle } from "@/features/conversations/components/DmConversationTitle";
import { NewConversationTitle } from "@/features/conversations/components/NewConversationTitle";
import { useRouter } from "@/navigation/useNavigation";
import {
  conversationWithPeerQueryKey,
  conversationsQueryKey,
} from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import {
  addConversationMessage,
  useConversationMessages,
} from "@/queries/useConversationMessages";
import { useConversationWithPeerQuery } from "@/queries/useConversationQuery";
import { V3ConversationListType } from "@/queries/useV3ConversationListQuery";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { sentryTrackError } from "@/utils/sentry";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { MessageId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect } from "react";

export const DmConversationScreen = memo(function DmConversationScreen(
  props: NativeStackScreenProps<NavigationParamList, "DmConversation">
) {
  const { peerAddress } = props.route.params;

  const currentAccount = useCurrentAccount()!;

  const { data: conversation, isLoading } = useConversationWithPeerQuery(
    currentAccount,
    peerAddress,
    {
      enabled: !!peerAddress,
    }
  );

  console.log("isLoading:", isLoading);
  console.log("conversation:", conversation);

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ flex: 1 }}>
        <Center
          style={{
            flex: 1,
          }}
        >
          <Loader />
        </Center>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ flex: 1 }}>
      {!!conversation ? (
        <ExistingDmConversation conversation={conversation} />
      ) : (
        <NewDmConversation peerAddress={peerAddress} />
      )}
      <ComposerWrapper peerAddress={peerAddress} />
      <KeyboardFiller />
    </Screen>
  );
});

const RANDOM_TOPIC = `RANDOM_TOPIC_${Math.random()}`;

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
      return {
        topic: RANDOM_TOPIC,
      };
      // return createConversationByAccount(currentAccount, peerAddress!);
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
    onMutate: (peerAddress) => {
      const currentAccount = getCurrentAccount()!;
      queryClient.setQueryData<ConversationWithCodecsType>(
        conversationWithPeerQueryKey(currentAccount, peerAddress),
        () => ({
          topic: RANDOM_TOPIC,
        })
      );
    },
  });

  const { mutateAsync: sendMessageAsync, status: sendMessageStatus } =
    useMutation({
      mutationFn: async (args: {
        conversation: ConversationWithCodecsType;
        text?: string;
        remoteAttachment?: RemoteAttachmentContentt;
        referencedMessageId?: MessageId;
      }) => {
        const { conversation, text, remoteAttachment, referencedMessageId } =
          args;

        return;

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
      onMutate: (args) => {
        try {
          const { conversation } = args;
          const currentAccount = getCurrentAccount()!;
          addConversationMessage(currentAccount, conversation.topic!, {
            id: "RANDOM_MESSAGE_ID",
            content: { text: "RANDOM_MESSAGE_TEXT" },
          });
        } catch (error) {
          console.log("error:", error);
        }
      },
    });

  const handleSendMessage = useCallback(
    async (args: IComposerSendArgs) => {
      try {
        const { text, remoteAttachment, referencedMessageId } = args;
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

  console.log("createNewConversationStatus:", createNewConversationStatus);
  console.log("sendMessageStatus:", sendMessageStatus);

  return <Composer onSend={handleSendMessage} />;
});

const NewDmConversation = memo(function NewDmConversation(props: {
  peerAddress: string;
}) {
  const { peerAddress } = props;

  useNewConversationHeader(peerAddress);

  // TODO: Add empty state
  return (
    <VStack
      style={{
        flex: 1,
      }}
    />
  );
});

function useNewConversationHeader(peerAddresss: string) {
  const navigation = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <NewConversationTitle peerAddress={peerAddresss} />,
    });
  }, [peerAddresss, navigation]);
}

const ExistingDmConversation = memo(function ExistingDmConversation(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const currentAccount = useCurrentAccount()!;

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch,
  } = useConversationMessages(currentAccount, conversation.topic!);

  useDmHeader();

  console.log("messagesLoading:", messagesLoading);
  console.log("messages:", messages);

  if (messages?.ids.length === 0 && !messagesLoading) {
    // TODO: Add empty state
    return null;
  }

  return (
    <VStack
      style={{
        flex: 1,
      }}
    >
      <MessagesList
        messageIds={messages?.ids ?? []}
        refreshing={isRefetchingMessages}
        onRefresh={refetch}
      />
    </VStack>
  );
});

function useDmHeader() {
  const navigation = useRouter();

  const topic = useConversationCurrentTopic();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <DmConversationTitle topic={topic!} />,
    });
  }, [topic, navigation]);
}
