import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef } from "react"
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Platform } from "react-native"
import Animated, { AnimatedProps, FadeInDown, useAnimatedRef } from "react-native-reanimated"
import { FlatListProps } from "react-native/Libraries/Lists/FlatList"
import { AnimatedVStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useConversationComposerStore } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer.store-context"
import { ConversationConsentPopupDm } from "@/features/conversation/conversation-chat/conversation-consent-popup/conversation-consent-popup-dm"
import { ConversationConsentPopupGroup } from "@/features/conversation/conversation-chat/conversation-consent-popup/conversation-consent-popup-group"
import { ConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message"
import { ConversationMessageLayout } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-layout"
import { ConversationMessageReactions } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/conversation-message-reactions"
import { ConversationMessageRepliable } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-repliable"
import { ConversationMessageStatus } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-status/conversation-message-status"
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-timestamp"
import { ConversationMessageContextStoreProvider } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { isAnActualMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { getMessageContentStringValue } from "@/features/conversation/conversation-list/hooks/use-message-content-string-value"
import { IConversation } from "@/features/conversation/conversation.types"
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { useBetterFocusEffect } from "@/hooks/use-better-focus-effect"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { convertNanosecondsToMilliseconds } from "@/utils/date"
import { GenericError } from "@/utils/error"
import { CONVERSATION_LIST_REFRESH_THRESHOLD } from "../conversation-list/conversation-list.contstants"
import { ConversationMessageHighlighted } from "./conversation-message/conversation-message-highlighted"
import { IConversationMessage } from "./conversation-message/conversation-message.types"
import { useMessageHasReactions } from "./conversation-message/hooks/use-message-has-reactions"
import { getConversationNextMessage } from "./conversation-message/utils/get-conversation-next-message"
import { getConversationPreviousMessage } from "./conversation-message/utils/get-conversation-previous-message"
import { useConversationStore, useCurrentXmtpConversationId } from "./conversation.store-context"

export const ConversationMessages = memo(function ConversationMessages(props: {
  conversation: IConversation
}) {
  const { conversation } = props

  const currentSender = useSafeCurrentSender()

  const xmtpConversationId = useCurrentXmtpConversationId()!

  const refreshingRef = useRef(false)

  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useConversationMessagesQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "Conversation Messages",
  })

  useBetterFocusEffect(
    useCallback(() => {
      refetchMessages().catch(captureError)
    }, [refetchMessages]),
  )

  const latestMessageIdByCurrentUser = useMemo(() => {
    return messages?.ids?.find(
      (messageId) =>
        isAnActualMessage(messages.byId[messageId]) &&
        messages.byId[messageId].senderInboxId === currentSender.inboxId,
    )
  }, [messages?.ids, messages?.byId, currentSender.inboxId])

  const { isUnread } = useConversationIsUnread({
    xmtpConversationId,
  })

  const { markAsReadAsync } = useMarkConversationAsRead({
    xmtpConversationId,
  })

  // TODO: Need improvment but okay for now
  useEffect(() => {
    if (isUnread && !messagesLoading) {
      markAsReadAsync().catch(captureError)
    }
  }, [isUnread, messagesLoading, markAsReadAsync])

  const handleRefresh = useCallback(async () => {
    try {
      refreshingRef.current = true
      await refetchMessages()
    } catch (error) {
      captureError(
        new GenericError({ error, additionalMessage: "Error refreshing conversation messages" }),
      )
    } finally {
      refreshingRef.current = false
    }
  }, [refetchMessages])

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (refreshingRef.current && !isRefetchingMessages) return
      if (e.nativeEvent.contentOffset.y < CONVERSATION_LIST_REFRESH_THRESHOLD) {
        handleRefresh()
      }
    },
    [handleRefresh, isRefetchingMessages],
  )

  const allMessages = Object.values(messages?.byId ?? {})

  return (
    <ConversationMessagesList
      messages={allMessages}
      refreshing={isRefetchingMessages}
      onRefresh={Platform.OS === "android" ? refetchMessages : undefined}
      onScroll={onScroll}
      ListEmptyComponent={
        isConversationDm(conversation) ? <DmConversationEmpty /> : <GroupConversationEmpty />
      }
      ListHeaderComponent={
        !isConversationAllowed(conversation) ? (
          isConversationDm(conversation) ? (
            <ConversationConsentPopupDm />
          ) : (
            <ConversationConsentPopupGroup />
          )
        ) : undefined
      }
      renderMessage={({ message, index }) => {
        const previousMessage = getConversationPreviousMessage({
          messageId: message.xmtpId,
          xmtpConversationId,
        })
        const nextMessage = getConversationNextMessage({
          messageId: message.xmtpId,
          xmtpConversationId,
        })
        return (
          <ConversationMessagesListItem
            message={message}
            previousMessage={previousMessage}
            nextMessage={nextMessage}
            isLatestMessageSentByCurrentUser={latestMessageIdByCurrentUser === message.xmtpId}
            animateEntering={
              index === 0 &&
              // Need this because otherwise because our optimistic updates, we first create a dummy message with a random id
              // and then replace it with the real message. But the replacment triggers a new element in the list because we use messageId as key extractor
              // Maybe we can have a better solution in the future. Just okay for now until we either have better serialization
              // or have better ways to handle optimistic updates.
              // @ts-expect-error until we have better serialization and have our own message type
              message.deliveryStatus === "sending"
            }
          />
        )
      }}
    />
  )
})

const ConversationMessagesListItem = memo(function ConversationMessagesListItem(props: {
  message: IConversationMessage
  previousMessage: IConversationMessage | undefined
  nextMessage: IConversationMessage | undefined
  isLatestMessageSentByCurrentUser: boolean
  animateEntering: boolean
}) {
  const {
    message,
    previousMessage,
    nextMessage,
    isLatestMessageSentByCurrentUser,
    animateEntering,
  } = props
  const { theme } = useAppTheme()
  const composerStore = useConversationComposerStore()

  const handleReply = useCallback(() => {
    composerStore.getState().setReplyToMessageId(message.xmtpId)
  }, [composerStore, message])

  const messageHasReactions = useMessageHasReactions({
    xmtpMessageId: message.xmtpId,
  })

  return (
    <ConversationMessageContextStoreProvider
      message={message}
      previousMessage={previousMessage}
      nextMessage={nextMessage}
    >
      <AnimatedVStack
        {...(animateEntering && {
          entering: FadeInDown.springify()
            .damping(theme.animation.spring.damping)
            .stiffness(theme.animation.spring.stiffness)
            .withInitialValues({
              transform: [
                {
                  translateY: 60,
                },
              ],
            }),
        })}
      >
        <ConversationMessageTimestamp />
        <ConversationMessageRepliable onReply={handleReply}>
          <ConversationMessageLayout
            message={
              <ConversationMessageHighlighted>
                <ConversationMessage message={message} />
              </ConversationMessageHighlighted>
            }
            reactions={messageHasReactions && <ConversationMessageReactions />}
            messageStatus={
              isLatestMessageSentByCurrentUser && (
                <ConversationMessageStatus status={message.status} />
              )
            }
          />
        </ConversationMessageRepliable>
      </AnimatedVStack>
    </ConversationMessageContextStoreProvider>
  )
})

const DmConversationEmpty = memo(function DmConversationEmpty() {
  // Will never really be empty anyway because to create the DM conversation the user has to send a first message
  return null
})

const GroupConversationEmpty = memo(() => {
  // Will never really be empty anyway becaue we have group updates
  return null
})

type ConversationMessagesListProps = Omit<
  AnimatedProps<FlatListProps<IConversationMessage>>,
  "renderItem" | "data"
> & {
  messages: IConversationMessage[]
  renderMessage: (args: { message: IConversationMessage; index: number }) => ReactElement
}

export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: ConversationMessagesListProps,
) {
  const { messages, renderMessage, ...rest } = props
  const { theme } = useAppTheme()
  const scrollRef = useAnimatedRef<FlatList>()
  const conversationStore = useConversationStore()

  useEffect(() => {
    const unsub = conversationStore.subscribe(
      (state) => state.scrollToXmtpMessageId,
      (scrollToXmtpMessageId) => {
        if (!scrollToXmtpMessageId) {
          return
        }

        const index = messages.findIndex((message) => message.xmtpId === scrollToXmtpMessageId)
        if (index === -1) {
          return
        }

        scrollRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: 100, // Random value just so that the message is not directly at the bottom
        })

        conversationStore.setState({
          scrollToXmtpMessageId: undefined,
        })
      },
    )

    return () => {
      unsub()
    }
  }, [conversationStore, messages, scrollRef])

  // return (
  //   <AnimatedLegendList
  //     // ref={scrollRef}
  //     data={messages}
  //     renderItem={({ item, index }) =>
  //       renderMessage({
  //         message: item,
  //         index,
  //       })
  //     }
  //     maintainScrollAtEnd
  //     maintainVisibleContentPosition
  //     initialScrollIndex={messages.length - 1}
  //     alignItemsAtEnd
  //     recycleItems={false} // Disable recycling since messages likely have local state
  //     // estimatedItemSize={176} // Random value that feels right
  //     // keyExtractor={keyExtractor}
  //     layout={theme.animation.reanimatedLayoutSpringTransition}
  //     waitForInitialLayout
  //     keyboardDismissMode="interactive"
  //     keyboardShouldPersistTaps="handled"
  //     showsVerticalScrollIndicator={Platform.OS === "ios"} // Size glitch on Android
  //     style={$globalStyles.flex1}
  //     drawDistance={100} // Increase draw distance for better performance when scrolling
  //     {...rest}
  //   />
  // )
  // Slow but works
  return (
    // @ts-expect-error
    <Animated.FlatList
      {...conversationMessagesListDefaultProps}
      ref={scrollRef}
      data={messages}
      layout={theme.animation.reanimatedLayoutSpringTransition}
      itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
      renderItem={({ item, index }) =>
        renderMessage({
          message: item,
          index,
        })
      }
      {...rest}
    />
  )
})

const keyExtractor = (message: IConversationMessage) => {
  const messageContentStr = getMessageContentStringValue({
    message,
  })
  // Round to nearest 10 seconds to avoid too many unique keys for messages sent close together
  const messageSentMs = convertNanosecondsToMilliseconds(message.sentNs)
  const roundedMs = Math.round(messageSentMs / 10) * 10
  return `${messageContentStr}-${message.senderInboxId}-${roundedMs}`
}

export const conversationMessagesListDefaultProps = {
  style: $globalStyles.flex1,
  inverted: true,
  keyboardDismissMode: "interactive" as const,
  keyboardShouldPersistTaps: "handled" as const,
  showsVerticalScrollIndicator: Platform.OS === "ios", // Size glitch on Android
  keyExtractor,
} satisfies Partial<FlatListProps<IConversationMessage>>
