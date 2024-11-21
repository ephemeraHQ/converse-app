import { MessageBubble } from "@components/Chat/Message/MessageBubble";
import {
  MessageContextProvider,
  useMessageContext,
} from "@components/Chat/Message/MessageContext";
import { V3MessageSender } from "@components/Chat/Message/MessageSender";
import { V3MessageSenderAvatar } from "@components/Chat/Message/MessageSenderAvatar";
import { MessageStatusDumb } from "@components/Chat/Message/MessageStatusDumb";
import { SwipeableMessageWrapper } from "@components/Chat/Message/SwipeableMessageWrapper";
import {
  MessageContextStoreProvider,
  useMessageContextStoreContext,
} from "@components/Chat/Message/messageContextStore";
import { useCurrentAccount } from "@data/store/accountsStore";
import { AnimatedHStack, HStack } from "@design-system/HStack";
import { Pressable } from "@design-system/Pressable";
import { AnimatedText, Text } from "@design-system/Text";
import { getTextStyle } from "@design-system/Text/Text.utils";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import {
  getGroupMessages,
  subscribeToGroupMessages,
} from "@queries/useGroupMessages";
import { useQuery } from "@tanstack/react-query";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime, getRelativeDate } from "@utils/date";
import { debugBorder } from "@utils/debug-style";
import logger from "@utils/logger";
import { flattenStyles } from "@utils/styles";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import { CoinbaseMessagingPaymentCodec } from "@utils/xmtpRN/contentTypes/coinbasePayment";
import { getInboxId } from "@utils/xmtpRN/signIn";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  ConversationTopic,
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { memo, useCallback, useEffect } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";
import { hasNextMessageInSeries } from "../../../features/conversations/utils/hasNextMessageInSeries";
import { hasPreviousMessageInSeries } from "../../../features/conversations/utils/hasPreviousMessageInSeries";
import { isLatestMessageSettledFromPeer } from "../../../features/conversations/utils/isLatestMessageSettledFromPeer";
import { isLatestSettledFromCurrentUser } from "../../../features/conversations/utils/isLatestSettledFromCurrentUser";
import { messageIsFromCurrentUserV3 } from "../../../features/conversations/utils/messageIsFromCurrentUser";
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
    queryFn: () => getInboxId(currentAccount!),
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
  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount();

  const _hasPreviousMessageInSeries =
    !!previousMessage &&
    hasPreviousMessageInSeries({
      currentMessage: message,
      previousMessage,
    });

  const _hasNextMessageInSeries =
    !!nextMessage &&
    hasNextMessageInSeries({
      currentMessage: message,
      nextMessage,
    });

  const showDateChange = messageShouldShowDateChange({
    message,
    previousMessage,
  });

  const fromMe = messageIsFromCurrentUserV3({
    message,
  });

  const isLatestSettledFromMe = isLatestSettledFromCurrentUser({
    message,
    currentAccount,
  });

  const isLatestSettledFromPeer =
    !!nextMessage &&
    isLatestMessageSettledFromPeer({
      message,
      currentAccount,
      nextMessage,
    });

  if (isTextMessage(message)) {
    const messageTyped = message as DecodedMessage<[TextCodec]>;

    const textContent = messageTyped.content();
    return (
      <MessageContextStoreProvider
        hasNextMessageInSeries={_hasNextMessageInSeries}
        fromMe={fromMe}
        sentAt={message.sent}
        hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
        showDateChange={showDateChange}
        senderAddress={messageTyped.senderAddress as InboxId}
      >
        <MessageContextProvider>
          <SimpleMessage message={textContent} />
          <MessageStatusDumb
            shouldDisplay={true}
            isLatestSettledFromMe={isLatestSettledFromMe}
            status={"sent"}
          />
        </MessageContextProvider>
      </MessageContextStoreProvider>
    );
  }

  if (isGroupUpdatedMessage(message)) {
    const messageTyped = message as DecodedMessage<[GroupUpdatedCodec]>;
    const content = messageTyped.content();

    console.log("showDateChange:", showDateChange);

    if (typeof content === "string") {
      // TODO
      console.error("group updated message is a string");
      return null;
    }

    return (
      <MessageContextStoreProvider
        hasNextMessageInSeries={_hasNextMessageInSeries}
        fromMe={fromMe}
        sentAt={message.sent}
        showDateChange={showDateChange}
        hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
        senderAddress={messageTyped.senderAddress as InboxId}
      >
        <MessageContextProvider>
          <VStack style={{ paddingVertical: theme.spacing.sm }}>
            <MessageTime />
            <ChatGroupUpdatedMessage content={content} />
          </VStack>
        </MessageContextProvider>
      </MessageContextStoreProvider>
    );
  }

  if (isReplyMessage(message)) {
    return null;
  }

  if (isRemoteAttachmentMessage(message)) {
    return null;
  }

  if (isStaticAttachmentMessage(message)) {
    return null;
  }

  if (isTransactionReferenceMessage(message)) {
    return null;
  }

  if (isCoinbasePaymentMessage(message)) {
    return null;
  }

  if (isReadReceiptMessage(message)) {
    return null;
  }

  if (isReactionMessage(message)) {
    return null;
  }

  // Need DecodedMessageAllTypes to work
  // const _ensureNever: never = message;
});

const SimpleMessage = memo(function SimpleMessage({
  message,
}: {
  message: string;
}) {
  const { theme } = useAppTheme();

  const [
    showDateChange,
    hasNextMessageInSeries,
    hasPreviousMessageInSeries,
    sentAt,
    senderAddress,
    fromMe,
  ] = useMessageContextStoreContext(
    useShallow((s) => [
      s.showDateChange,
      s.hasNextMessageInSeries,
      s.hasPreviousMessageInSeries,
      s.sentAt,
      s.senderAddress,
      s.fromMe,
    ])
  );

  const { toggleTime } = useMessageContext();

  const handlePressBubble = useCallback(() => {
    toggleTime();
  }, [toggleTime]);

  return (
    <>
      <MessageTime />

      {/* Maybe place in List separator instead? Not sure */}
      {hasNextMessageInSeries && (
        <VStack
          style={{
            ...debugBorder(),
            height: theme.spacing["4xs"],
          }}
        />
      )}

      {!hasNextMessageInSeries && (
        <VStack
          style={{
            ...debugBorder("yellow"),
            height: theme.spacing.sm,
          }}
        />
      )}

      <SwipeableMessageWrapper
        onReply={() => {
          console.log("reply");
        }}
      >
        {fromMe ? (
          <HStack
            style={{
              ...debugBorder("red"),
              flex: 1,
              paddingHorizontal: theme.spacing.sm,
              justifyContent: "flex-end",
            }}
          >
            <VStack style={{ paddingLeft: theme.spacing.xxs }}>
              {!fromMe && !hasPreviousMessageInSeries && (
                <V3MessageSender inboxId={senderAddress} />
              )}
              <Pressable onPress={handlePressBubble}>
                <MessageBubble content={message} />
              </Pressable>
            </VStack>
          </HStack>
        ) : (
          <HStack
            style={{
              ...debugBorder("red"),
              flex: 1,
              paddingHorizontal: theme.spacing.sm,
              alignItems: "flex-end",
            }}
          >
            <V3MessageSenderAvatar inboxId={senderAddress} />
            <VStack style={{ paddingLeft: theme.spacing.xxs }}>
              {!fromMe && !hasPreviousMessageInSeries && (
                <V3MessageSender inboxId={senderAddress} />
              )}
              <Pressable onPress={handlePressBubble}>
                <MessageBubble content={message} />
              </Pressable>
            </VStack>
          </HStack>
        )}
      </SwipeableMessageWrapper>
    </>
  );
});

const MessageTime = memo(function MessageTime() {
  const { theme, themed } = useAppTheme();

  const [sentAt, showDateChange] = useMessageContextStoreContext((s) => [
    s.sentAt,
    s.showDateChange,
  ]);

  const { showTimeAV } = useMessageContext();

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const messageTime = getLocalizedTime(sentAt);

  const textHeight = flattenStyles(
    getTextStyle(themed, { preset: "smaller" })
  ).lineHeight;

  const timeAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        showTimeProgressAV.value,
        [0, 1],
        [0, textHeight || 14]
      ),
      opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
      marginVertical: interpolate(
        showTimeProgressAV.value,
        [0, 1],
        [0, theme.spacing.sm]
      ),
      transform: [
        { scale: showTimeProgressAV.value },
        {
          translateY: interpolate(
            showTimeProgressAV.value,
            [0, 1],
            [theme.spacing.xl, 0]
          ),
        },
      ],
    };
  }, [textHeight]);

  const timeInlineAnimatedStyle = useAnimatedStyle(() => {
    return {
      display: showTimeAV.value ? "flex" : "none",
      opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
    };
  });

  if (showDateChange) {
    const messageDate = getRelativeDate(sentAt);

    return (
      <AnimatedHStack
        layout={theme.animation.springLayoutTransition}
        style={{
          // ...debugBorder("red"),
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          columnGap: theme.spacing["4xs"],
          marginVertical: theme.spacing.sm,
        }}
      >
        <Text preset="smaller" color="secondary">
          {messageDate}
        </Text>
        <AnimatedText
          preset="smaller"
          color="secondary"
          style={timeInlineAnimatedStyle}
        >
          {messageTime}
        </AnimatedText>
        {/* {message.dateChange && (
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateTime}>{messageDate}</Text>
        <Animated.Text style={[dateTimeAnimatedStyle, styles.dateTime]}>
          {` – ${messageTime}`}
        </Animated.Text>
      </View>
    )}
    {!message.dateChange && showTime && (
      <Animated.View style={timeAnimatedStyle}>
        <Text style={styles.dateTime}>{messageTime}</Text>
      </Animated.View>
    )} */}
      </AnimatedHStack>
    );
  }

  return (
    <AnimatedVStack
      style={[
        {
          // ...debugBorder("yellow"),
          alignItems: "center",
          overflow: "hidden",
          width: "100%",
        },
        timeAnimatedStyle,
      ]}
    >
      <Text preset="smaller" color="secondary">
        {messageTime}
      </Text>
      {/* {message.dateChange && (
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTime}>{messageDate}</Text>
          <Animated.Text style={[dateTimeAnimatedStyle, styles.dateTime]}>
            {` – ${messageTime}`}
          </Animated.Text>
        </View>
      )}
      {!message.dateChange && showTime && (
        <Animated.View style={timeAnimatedStyle}>
          <Text style={styles.dateTime}>{messageTime}</Text>
        </Animated.View>
      )} */}
    </AnimatedVStack>
  );
});

// type DecodedMessageAllTypes =
//   | DecodedMessage<[TextCodec]>
//   | DecodedMessage<[ReactionCodec]>
//   | DecodedMessage<[ReadReceiptCodec]>
//   | DecodedMessage<[GroupUpdatedCodec]>
//   | DecodedMessage<[ReplyCodec]>
//   | DecodedMessage<[RemoteAttachmentCodec]>
//   | DecodedMessage<[StaticAttachmentCodec]>
//   | DecodedMessage<[TransactionReferenceCodec]>
//   | DecodedMessage<[CoinbaseMessagingPaymentCodec]>;

function isTextMessage(message: any): message is DecodedMessage<[TextCodec]> {
  return getMessageContentType(message.contentTypeId) === "text";
}

function isReactionMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[ReactionCodec]> {
  return getMessageContentType(message.contentTypeId) === "reaction";
}

function isReadReceiptMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[ReadReceiptCodec]> {
  return getMessageContentType(message.contentTypeId) === "readReceipt";
}

function isGroupUpdatedMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[GroupUpdatedCodec]> {
  return getMessageContentType(message.contentTypeId) === "groupUpdated";
}

function isReplyMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[ReplyCodec]> {
  return getMessageContentType(message.contentTypeId) === "reply";
}

function isRemoteAttachmentMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[RemoteAttachmentCodec]> {
  return getMessageContentType(message.contentTypeId) === "remoteAttachment";
}

function isStaticAttachmentMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[StaticAttachmentCodec]> {
  return getMessageContentType(message.contentTypeId) === "remoteAttachment";
}

function isTransactionReferenceMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[TransactionReferenceCodec]> {
  return (
    getMessageContentType(message.contentTypeId) === "transactionReference"
  );
}

function isCoinbasePaymentMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[CoinbaseMessagingPaymentCodec]> {
  return getMessageContentType(message.contentTypeId) === "coinbasePayment";
}
