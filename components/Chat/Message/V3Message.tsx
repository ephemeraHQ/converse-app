import { MessageContextProvider } from "@/components/Chat/Message/contexts/message-context";
import { MessageStaticAttachment } from "@/components/Chat/Message/message-content-types/message-static-attachment";
import { MessageContextStoreProvider } from "@/components/Chat/Message/stores/message-store";
import { VStack } from "@/design-system/VStack";
import { InboxId, MessageId } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { getCurrentConversationMessages } from "../../../features/conversation/conversation-service";
import { hasNextMessageInSeries } from "../../../features/conversations/utils/hasNextMessageInSeries";
import { hasPreviousMessageInSeries } from "../../../features/conversations/utils/hasPreviousMessageInSeries";
import { messageIsFromCurrentUserV3 } from "../../../features/conversations/utils/messageIsFromCurrentUser";
import { messageShouldShowDateChange } from "../../../features/conversations/utils/messageShouldShowDateChange";
import { ChatGroupUpdatedMessage } from "../ChatGroupUpdatedMessage";
import { MessageRemoteAttachment } from "./message-content-types/message-remote-attachment";
import { MessageReply } from "./message-content-types/message-reply";
import { MessageSimpleText } from "./message-content-types/message-simple-text";
import {
  convertNanosecondsToMilliseconds,
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
} from "./message-utils";

type V3MessageProps = {
  messageId: string;
  previousMessageId: string;
  nextMessageId: string;
};

export const V3Message = memo(
  ({ messageId, previousMessageId, nextMessageId }: V3MessageProps) => {
    const messages = getCurrentConversationMessages()!;

    const message = messages.byId[messageId];
    const previousMessage = messages.byId[previousMessageId];
    const nextMessage = messages.byId[nextMessageId];

    const _hasPreviousMessageInSeries =
      !!previousMessage &&
      hasPreviousMessageInSeries({
        currentMessage: message,
        previousMessage,
      });

    const _hasNextMessageInSeries = Boolean(
      !!nextMessage &&
        message &&
        hasNextMessageInSeries({
          currentMessage: message,
          nextMessage,
        })
    );

    const showDateChange = messageShouldShowDateChange({
      message,
      previousMessage,
    });

    const fromMe = messageIsFromCurrentUserV3({
      message,
    });

    // const isLatestSettledFromMe = isLatestSettledFromCurrentUser({
    //   message,
    //   currentAccount,
    // });

    // const isLatestSettledFromPeer =
    //   !!nextMessage &&
    //   isLatestMessageSettledFromPeer({
    //     message,
    //     currentAccount,
    //     nextMessage,
    //   });

    if (!message) {
      console.log("no message found", messageId);
      return null;
    }

    const reactions = messages.reactions[message.id];

    console.log("reactions:", reactions);

    return (
      <VStack
        style={
          {
            // ...debugBorder(),
          }
        }
      >
        <MessageContextStoreProvider
          messageId={message.id as MessageId}
          hasNextMessageInSeries={_hasNextMessageInSeries}
          fromMe={fromMe}
          sentAt={convertNanosecondsToMilliseconds(message.sentNs)}
          showDateChange={showDateChange}
          hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
          senderAddress={message.senderAddress as InboxId}
          isHighlighted={false}
        >
          <MessageContextProvider>
            {isTextMessage(message) && <MessageSimpleText message={message} />}
            {isGroupUpdatedMessage(message) && (
              <ChatGroupUpdatedMessage message={message} />
            )}
            {isReplyMessage(message) && <MessageReply message={message} />}
            {isRemoteAttachmentMessage(message) && (
              <MessageRemoteAttachment message={message} />
            )}
            {isStaticAttachmentMessage(message) && (
              <MessageStaticAttachment message={message} />
            )}
          </MessageContextProvider>
        </MessageContextStoreProvider>
      </VStack>
    );
  }
);

// function useConversationMessageById(messageId: MessageId) {
//   const currentAccount = useCurrentAccount()!;
//   const messages = getCurrentConversationMessages();

//   const cachedMessage = messages?.byId[messageId];

//   // Only fetch the message if it's not already in the conversation messages
//   const { data: message, isLoading: isLoadingMessage } = useQuery({
//     ...getConversationMessageQueryOptions({
//       account: currentAccount,
//       messageId,
//     }),
//     enabled: !cachedMessage,
//   });

//   return {
//     message: message ?? cachedMessage,
//     isLoading: !cachedMessage && isLoadingMessage,
//   };
// }
