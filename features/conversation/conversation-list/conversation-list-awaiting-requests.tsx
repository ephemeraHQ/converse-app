import { useNavigation } from "@react-navigation/native"
import { useQueries } from "@tanstack/react-query"
import React, { memo, useCallback, useMemo } from "react"
import { Center } from "@/design-system/Center"
import { AnimatedHStack, HStack } from "@/design-system/HStack"
import { Image } from "@/design-system/image"
import { AnimatedVStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  ConversationListItem,
  ConversationListItemSubtitle,
  ConversationListItemTitle,
} from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { useConversationRequestsListItem } from "@/features/conversation/conversation-requests-list/use-conversation-requests-list-items"
import { getConversationQueryOptions } from "@/features/conversation/queries/conversation.query"
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account"
import { useBetterFocusEffect } from "@/hooks/use-better-focus-effect"
import { useAppTheme } from "@/theme/use-app-theme"

export const ConversationListAwaitingRequests = memo(function ConversationListAwaitingRequests() {
  const { theme } = useAppTheme()
  const navigation = useNavigation()
  const currentSender = useSafeCurrentSender()

  const {
    likelyNotSpamConversationIds,
    isLoading: isLoadingUknownConversations,
    refetch,
  } = useConversationRequestsListItem()

  useBetterFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch]),
  )

  // Fetch metadata queries
  const conversationsMetadataQueryResult = useQueries({
    queries: (likelyNotSpamConversationIds ?? []).map((conversationId) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
      }),
    ),
  })

  // Fetch conversation queries
  const conversationQueries = useQueries({
    queries: (likelyNotSpamConversationIds ?? []).map((conversationId) => ({
      ...getConversationQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
        caller: "ConversationListAwaitingRequests",
      }),
    })),
  })

  // Combine the results
  const { numberOfRequestsLikelyNotSpam, hasUnreadMessages } = useMemo(() => {
    const numberOfRequestsLikelyNotSpam = likelyNotSpamConversationIds.length

    const hasUnreadMessages = conversationsMetadataQueryResult.some((metadataQuery, index) => {
      if (!metadataQuery.data) {
        return false
      }

      const conversationQuery = conversationQueries[index]

      if (!conversationQuery.data) {
        return false
      }

      return conversationIsUnreadForInboxId({
        lastMessageSent: conversationQuery.data?.lastMessage?.sentNs ?? null,
        lastMessageSenderInboxId: conversationQuery.data?.lastMessage?.senderInboxId ?? null,
        consumerInboxId: currentSender.inboxId,
        markedAsUnread: metadataQuery.data?.unread ?? false,
        readUntil: metadataQuery.data?.readUntil
          ? new Date(metadataQuery.data.readUntil).getTime()
          : null,
      })
    })

    return {
      numberOfRequestsLikelyNotSpam,
      hasUnreadMessages,
    }
  }, [
    likelyNotSpamConversationIds,
    // eslint-disable-next-line @tanstack/query/no-unstable-deps
    conversationsMetadataQueryResult,
    // eslint-disable-next-line @tanstack/query/no-unstable-deps
    conversationQueries,
    currentSender,
  ])

  const title = useMemo(() => {
    return (
      <HStack
        style={{
          alignItems: "center",
          columnGap: theme.spacing.xxs,
        }}
      >
        <ConversationListItemTitle>Requests</ConversationListItemTitle>
      </HStack>
    )
  }, [theme])

  const subtitle = useMemo(() => {
    const getSubtitleText = () => {
      if (isLoadingUknownConversations) {
        return "Checking for invites"
      }
      if (numberOfRequestsLikelyNotSpam === 0) {
        return "All clear"
      }
      return `${numberOfRequestsLikelyNotSpam} new contact${
        numberOfRequestsLikelyNotSpam > 1 ? "s" : ""
      }`
    }

    const text = getSubtitleText()

    return (
      <AnimatedHStack
        key={text} // Doing this to make sure the animation is triggered
        entering={theme.animation.reanimatedFadeInSpring}
        exiting={theme.animation.reanimatedFadeOutSpring}
      >
        <ConversationListItemSubtitle>{text}</ConversationListItemSubtitle>
      </AnimatedHStack>
    )
  }, [isLoadingUknownConversations, numberOfRequestsLikelyNotSpam, theme])

  return (
    <AnimatedVStack
      layout={theme.animation.reanimatedLayoutSpringTransition}
      entering={theme.animation.reanimatedFadeInSpring}
    >
      <ConversationListItem
        title={title}
        subtitle={subtitle}
        onPress={() => {
          navigation.navigate("ChatsRequests")
        }}
        isUnread={hasUnreadMessages}
        avatarComponent={
          <Center
            // {...debugBorder()}
            style={{
              width: theme.avatarSize.lg,
              height: theme.avatarSize.lg,
              backgroundColor: theme.colors.fill.tertiary,
              borderRadius: 999,
            }}
          >
            {/* TODO: Add skia to make it better and add the little "shield" icon */}
            <Image
              source={
                theme.isDark
                  ? require("@/assets/icons/chat-bubble-dark.png")
                  : require("@/assets/icons/chat-bubble-light.png")
              }
              style={{
                width: theme.avatarSize.sm,
                height: theme.avatarSize.sm,
              }}
              contentFit="contain"
            />
          </Center>
        }
      />
    </AnimatedVStack>
  )
})
