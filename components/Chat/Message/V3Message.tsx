import {
  BubbleContainer,
  BubbleContentContainer,
} from "@components/Chat/Message/MessageBubble";
import {
  MessageContextProvider,
  useMessageContext,
} from "@components/Chat/Message/MessageContext";
import { V3MessageSender } from "@components/Chat/Message/MessageSender";
import { V3MessageSenderAvatar } from "@components/Chat/Message/MessageSenderAvatar";
import { RepliableMessageWrapper } from "@components/Chat/Message/RepliableMessageWrapper";
import { MessageText } from "@components/Chat/Message/TextMessage";
import {
  MessageContextStoreProvider,
  useMessageContextStoreContext,
} from "@components/Chat/Message/messageContextStore";
import { useCurrentAccount } from "@data/store/accountsStore";
import { AnimatedHStack, HStack } from "@design-system/HStack";
import { Icon } from "@design-system/Icon/Icon";
import { Pressable } from "@design-system/Pressable";
import { AnimatedText, Text } from "@design-system/Text";
import { getTextStyle } from "@design-system/Text/Text.utils";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { getConversationMessageQueryOptions } from "@queries/useConversationMessage";
import { useQuery } from "@tanstack/react-query";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime, getRelativeDate } from "@utils/date";
import logger from "@utils/logger";
import { getReadableProfile } from "@utils/str";
import { flattenStyles } from "@utils/styles";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  MessageId,
  ReplyCodec,
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
import { useMessageText } from "../../../features/conversation-list/hooks/useMessageText";
import {
  getCurrentConversationMessages,
  setCurrentConversationReplyToMessageId,
  useConversationCurrentTopic,
} from "../../../features/conversation/conversation-service";
import { hasNextMessageInSeries } from "../../../features/conversations/utils/hasNextMessageInSeries";
import { hasPreviousMessageInSeries } from "../../../features/conversations/utils/hasPreviousMessageInSeries";
import { messageIsFromCurrentUserV3 } from "../../../features/conversations/utils/messageIsFromCurrentUser";
import { messageShouldShowDateChange } from "../../../features/conversations/utils/messageShouldShowDateChange";
import { ChatGroupUpdatedMessage } from "../ChatGroupUpdatedMessage";
import {
  isCoinbasePaymentMessage,
  isGroupUpdatedMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
  isTransactionReferenceMessage,
} from "./Message.utils";

type V3MessageProps = {
  messageId: string;
  nextMessageId: string | undefined;
  previousMessageId: string | undefined;
};

export const V3Message = memo(
  ({ messageId, nextMessageId, previousMessageId }: V3MessageProps) => {
    const currentAccount = useCurrentAccount()!;
    const topic = useConversationCurrentTopic();
    const messages = getCurrentConversationMessages();

    const message = messages?.byId[messageId];
    const previousMessage = messages?.byId[previousMessageId ?? ""];
    const nextMessage = messages?.byId[nextMessageId ?? ""];

    // We only want to update the message data if something changed with current, previous, or next
    useEffect(() => {
      // const unsubscribe = subscribeToGroupMessages({
      //   account: currentAccount,
      //   topic,
      //   callback: ({ data }) => {
      //     if (data) {
      //       const message = data.byId[messageId];
      //       const nextMessage = data.byId[nextMessageId];
      //       const previousMessage = data.byId[previousMessageId];
      //       // If the updated at changed, update the message
      //     }
      //   },
      // });
      // return () => {
      //   unsubscribe();
      // };
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

  if (isReplyMessage(message)) {
    return (
      <MessageContextStoreProvider
        messageId={message.id}
        hasNextMessageInSeries={_hasNextMessageInSeries}
        fromMe={fromMe}
        sentAt={convertNanosecondsToMilliseconds(message.sentNs)}
        showDateChange={showDateChange}
        hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
        senderAddress={message.senderAddress as InboxId}
      >
        <ReplyMessage />
      </MessageContextStoreProvider>
    );
  }

  if (isTextMessage(message)) {
    const messageTyped = message as DecodedMessage<[TextCodec]>;

    const textContent = messageTyped.content();
    return (
      <MessageContextStoreProvider
        messageId={message.id}
        hasNextMessageInSeries={_hasNextMessageInSeries}
        fromMe={fromMe}
        sentAt={convertNanosecondsToMilliseconds(message.sentNs)}
        hasPreviousMessageInSeries={_hasPreviousMessageInSeries}
        showDateChange={showDateChange}
        senderAddress={messageTyped.senderAddress as InboxId}
      >
        <MessageContextProvider>
          <SimpleMessage message={textContent} />
          {/* <MessageStatusDumb
            shouldDisplay={true}
            isLatestSettledFromMe={isLatestSettledFromMe}
            status={"sent"}
          /> */}
        </MessageContextProvider>
      </MessageContextStoreProvider>
    );
  }

  if (isGroupUpdatedMessage(message)) {
    const messageTyped = message as DecodedMessage<[GroupUpdatedCodec]>;
    const content = messageTyped.content();

    if (typeof content === "string") {
      // TODO
      console.error("group updated message is a string");
      return null;
    }

    return (
      <MessageContextStoreProvider
        messageId={message.id}
        hasNextMessageInSeries={_hasNextMessageInSeries}
        fromMe={fromMe}
        sentAt={convertNanosecondsToMilliseconds(message.sentNs)}
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
  throw new Error("Unknown message type");
  return null;
});

function useConversationMessageForReplyMessage(
  messageId: MessageId
): DecodedMessage<[ReplyCodec]> | undefined {
  const topic = useConversationCurrentTopic();
  const currentAccount = useCurrentAccount()!;
  const messages = getCurrentConversationMessages();

  const cachedReplyMessage = messages?.byId[messageId] as
    | DecodedMessage<[ReplyCodec]>
    | undefined;

  // Only fetch the message if it's in the list of messages of the conversation
  const { data: replyMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      account: currentAccount,
      messageId,
    }),
    enabled: !cachedReplyMessage,
  });

  return (
    (replyMessage as DecodedMessage<[ReplyCodec]> | undefined) ??
    cachedReplyMessage
  );
}

const ReplyMessage = memo(function ReplyMessage() {
  const { theme } = useAppTheme();

  const {
    messageId,
    fromMe,
    senderAddress,
    hasPreviousMessageInSeries,
    hasNextMessageInSeries,
    showDateChange,
  } = useMessageContextStoreContext((s) => ({
    messageId: s.messageId,
    fromMe: s.fromMe,
    senderAddress: s.senderAddress,
    hasPreviousMessageInSeries: s.hasPreviousMessageInSeries,
    hasNextMessageInSeries: s.hasNextMessageInSeries,
    showDateChange: s.showDateChange,
  }));

  const replyMessage = useConversationMessageForReplyMessage(messageId);

  if (!replyMessage) {
    return null;
  }

  const replyMessageContent = replyMessage?.content();

  if (!replyMessageContent) {
    // TODO
    return null;
  }

  if (typeof replyMessageContent === "string") {
    // TODO. Render simple bubble message with the content?
    console.error("reply message is a string");
    return null;
  }

  return (
    <>
      <RepliableMessageWrapper
        onReply={() => {
          setCurrentConversationReplyToMessageId(messageId);
        }}
      >
        <MessageContainer fromMe={fromMe}>
          {!fromMe && <V3MessageSenderAvatar inboxId={senderAddress} />}
          {!fromMe && <VStack style={{ width: theme.spacing.xxs }} />}

          <VStack>
            {!fromMe && !hasPreviousMessageInSeries && (
              <V3MessageSender inboxId={senderAddress} />
            )}

            <BubbleContainer fromMe={fromMe}>
              <BubbleContentContainer
                fromMe={fromMe}
                hasNextMessageInSeries={hasNextMessageInSeries}
                showDateChange={showDateChange}
                hasPreviousMessageInSeries={hasPreviousMessageInSeries}
              >
                <Pressable
                  onPress={() => {
                    console.log("handle press bubble");
                  }}
                  style={{
                    rowGap: theme.spacing.xxs,
                    marginTop: theme.spacing.xxxs, // Because for reply bubble we want the padding to be same for horizontal and vertial
                  }}
                >
                  <ReplyMessageReference
                    referenceMessageId={
                      replyMessageContent.reference as MessageId
                    }
                  />
                  <MessageText inverted={fromMe}>
                    {replyMessageContent.content.text}
                  </MessageText>
                </Pressable>
              </BubbleContentContainer>
            </BubbleContainer>
          </VStack>
        </MessageContainer>
      </RepliableMessageWrapper>
      <MessageSeparator />
    </>
  );
});

const MessageContainer = memo(function MessageContainer(props: {
  children: React.ReactNode;
  fromMe: boolean;
}) {
  const { children, fromMe } = props;

  const { theme } = useAppTheme();

  return (
    <HStack
      style={{
        // ...debugBorder("red"),
        flex: 1,
        alignItems: "flex-end",
        ...(fromMe
          ? { paddingRight: theme.spacing.sm, justifyContent: "flex-end" }
          : { paddingLeft: theme.spacing.sm, justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
});

const ReplyMessageReference = memo(function ReplyMessageReference(props: {
  referenceMessageId: MessageId;
}) {
  const { referenceMessageId } = props;

  const { theme } = useAppTheme();

  const fromMe = useMessageContextStoreContext((s) => s.fromMe);

  const currentAccount = useCurrentAccount()!;

  const replyMessageReference =
    useConversationMessageForReplyMessage(referenceMessageId);

  const replyMessageReferenceText = useMessageText(replyMessageReference);

  const readableProfile = replyMessageReference
    ? getReadableProfile(currentAccount, replyMessageReference.senderAddress)
    : null;

  return (
    <VStack
      style={{
        rowGap: theme.spacing.xxxs,
        flex: 1,
        backgroundColor: fromMe
          ? theme.colors.bubbles.nestedReplyFromMe
          : theme.colors.bubbles.nestedReply,
        borderRadius: theme.spacing.sm - theme.spacing.xs / 2, // - theme.spacing.xs / 2 so the border fits the border radius of BubbleContentContainer
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xxs,
      }}
    >
      <HStack
        style={{
          alignItems: "center",
          columnGap: theme.spacing.xxxs,
        }}
      >
        <Icon
          size={theme.iconSize.xs}
          icon="arrowshape.turn.up.left.fill"
          color={
            fromMe
              ? theme.colors.text.inverted.secondary
              : theme.colors.text.secondary
          }
        />
        <Text preset="smaller" color="secondary" inverted={fromMe}>
          {readableProfile}
        </Text>
      </HStack>
      <Text numberOfLines={1} inverted={fromMe}>
        {replyMessageReferenceText}
      </Text>
    </VStack>
  );
});

const SimpleMessage = memo(function SimpleMessage({
  message,
}: {
  message: string;
}) {
  const { theme } = useAppTheme();

  const [
    messageId,
    showDateChange,
    hasNextMessageInSeries,
    hasPreviousMessageInSeries,
    senderAddress,
    fromMe,
  ] = useMessageContextStoreContext(
    useShallow((s) => [
      s.messageId,
      s.showDateChange,
      s.hasNextMessageInSeries,
      s.hasPreviousMessageInSeries,
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

      <RepliableMessageWrapper
        onReply={() => {
          setCurrentConversationReplyToMessageId(messageId);
        }}
      >
        <MessageContainer fromMe={fromMe}>
          {!fromMe && <V3MessageSenderAvatar inboxId={senderAddress} />}

          <VStack>
            <BubbleContainer fromMe={fromMe}>
              <BubbleContentContainer
                fromMe={fromMe}
                hasNextMessageInSeries={hasNextMessageInSeries}
                showDateChange={showDateChange}
                hasPreviousMessageInSeries={hasPreviousMessageInSeries}
              >
                <Pressable onPress={handlePressBubble}>
                  <MessageText inverted={fromMe}>{message}</MessageText>
                </Pressable>
              </BubbleContentContainer>
            </BubbleContainer>
          </VStack>
        </MessageContainer>
      </RepliableMessageWrapper>

      <MessageSeparator />
    </>
  );
});

const MessageSeparator = memo(function MessageSeparator() {
  const { theme } = useAppTheme();
  return <VStack style={{ height: theme.spacing["4xs"] }} />;
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

  const messageTime = sentAt ? getLocalizedTime(sentAt) : "";

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
        layout={theme.animation.reanimatedSpringLayoutTransition}
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

function convertNanosecondsToMilliseconds(nanoseconds: number) {
  return nanoseconds / 1000000;
}
