import { SimpleMessage } from "@components/Chat/Message/SimpleMessage";
import { SwipeableMessageWrapper } from "@components/Chat/Message/SwipeableMessageWrapper";
import { MessageContextStoreProvider } from "@components/Chat/Message/messageContextStore";
import { useCurrentAccount } from "@data/store/accountsStore";
import { VStack } from "@design-system/VStack";
import { subscribeToGroupMessages } from "@queries/useGroupMessages";
import { useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import {
  ConversationTopic,
  GroupUpdatedContent,
  getOrCreateInboxId,
} from "@xmtp/react-native-sdk";
import { memo, useEffect } from "react";
import config from "../../../config";
import { hasNextMessageInSeries } from "../../../features/conversations/utils/hasNextMessageInSeries";
import { hasPreviousMessageInSeries } from "../../../features/conversations/utils/hasPreviousMessageInSeries";
import { isLatestMessageSettledFromPeer } from "../../../features/conversations/utils/isLatestMessageSettledFromPeer";
import { isLatestSettledFromCurrentUser } from "../../../features/conversations/utils/isLatestSettledFromCurrentUser";
import { messageIsFromCurrentUser } from "../../../features/conversations/utils/messageIsFromCurrentUser";
import { messageShouldShowDateChange } from "../../../features/conversations/utils/messageShouldShowDateChange";
import { ChatGroupUpdatedMessage } from "../ChatGroupUpdatedMessage";

type V3MessageProps = {
  messageId: string;
  nextMessageId: string | undefined;
  previousMessageId: string | undefined;
  currentAccount: string;
  topic: ConversationTopic;
};

// TMP until we move this into an account store or something like that
function useCurrentAccountInboxId() {
  const currentAccount = useCurrentAccount();
  return useQuery({
    queryKey: ["inboxId", currentAccount],
    queryFn: () => getOrCreateInboxId(currentAccount!, config.xmtpEnv),
    enabled: !!currentAccount,
  });
}

export const V3Message = memo(
  ({
    messageId,
    nextMessageId,
    previousMessageId,
    currentAccount,
    topic,
  }: V3MessageProps) => {
    const messages = getGroupMessages(currentAccount, topic);

    const message = messages?.byId[messageId];
    const previousMessage = messages?.byId[previousMessageId ?? ""];
    const nextMessage = messages?.byId[nextMessageId ?? ""];

    // We only want to update the message data if something changed with current, previous, or next
    useEffect(() => {
      const unsubscribe = subscribeToGroupMessages({
        account: currentAccount,
        topic,
        callback: ({ data }) => {
          if (data) {
            const message = data.byId[messageId];
            const nextMessage = data.byId[nextMessageId];
            const previousMessage = data.byId[previousMessageId];
            // If the updated at changed, update the message
          }
        },
      });

      return () => {
        unsubscribe();
      };
    }, [currentAccount, topic, messageId, nextMessageId, previousMessageId]);

    if (!message) {
      logger.error("[Message] message is undefined");
      return null;
    }

    return (
      <V3MessageContent
        message={message}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
      />
    );
  }
);

export const V3MessageContent = memo(function V3MessageContent({
  message,
  previousMessage,
  nextMessage,
}: {
  message: DecodedMessageWithCodecsType;
  previousMessage: DecodedMessageWithCodecsType | undefined;
  nextMessage: DecodedMessageWithCodecsType | undefined;
}) {
  const currentAccount = useCurrentAccount();

  const contentType = getMessageContentType(message?.contentTypeId);

  const hasPreviousMessageInSeriesValue =
    !!previousMessage &&
    hasPreviousMessageInSeries({
      currentMessage: message,
      previousMessage,
    });

  const hasNextMessageInSeriesValue =
    !!nextMessage &&
    hasNextMessageInSeries({
      currentMessage: message,
      nextMessage,
    });

  const showDateChange =
    !!previousMessage &&
    messageShouldShowDateChange({
      message,
      previousMessage,
    });

  const fromMeValue = messageIsFromCurrentUser({
    message,
  });

  const isLatestSettledFromMeValue = isLatestSettledFromCurrentUser({
    message,
    currentAccount,
  });

  const isLatestSettledFromPeerValue =
    !!nextMessage &&
    isLatestMessageSettledFromPeer({
      message,
      currentAccount,
      nextMessage,
    });

  let content;
  try {
    content = message?.content();
  } catch {
    content = message?.fallback ?? "";
  }

  console.log("content:", content);

  switch (contentType) {
    case "groupUpdated":
      return (
        <VStack>
          <ChatGroupUpdatedMessage
            content={content as unknown as GroupUpdatedContent}
          />
        </VStack>
      );

    case "text":
      const textContent = content as string;

      // const hideBackground = isAllEmojisAndMaxThree(textContent as string);
      return (
        <MessageContextStoreProvider
          hasNextMessageInSeries={hasNextMessageInSeriesValue}
          fromMe={fromMeValue}
        >
          {showDateChange && <DateChangeIndicator />}
          <SwipeableMessageWrapper
            onReply={() => {
              console.log("reply");
            }}
          >
            <SimpleMessage content={textContent} />
          </SwipeableMessageWrapper>
        </MessageContextStoreProvider>
      );

    case "reaction":
    case "reply":
    case "readReceipt":
    case "transactionReference":
    case "coinbasePayment":
    case "remoteAttachment":
    case "attachment":
    default:
      console.log("COULDN'T HANDLE THIS MESSAGE TYPE", contentType);
      return null;
      // const _ensureNever: never = contentType;
      return (
        <VStack>
          <SimpleMessage
            fromMe={fromMeValue}
            hasNextMessageInSeries={hasNextMessageInSeriesValue}
            // content={contentType + message.deliveryStatus + index}
          />
        </VStack>
      );
  }
});

const DateChangeIndicator = memo(function DateChangeIndicator() {
  return null;
});
