import { useCurrentAccount } from "../authentication/account.store";
import { Center } from "@/design-system/Center";
import { AnimatedHStack, HStack } from "@/design-system/HStack";
import { AnimatedVStack } from "@/design-system/VStack";
import { Image } from "@/design-system/image";
import {
  ConversationListItem,
  ConversationListItemSubtitle,
  ConversationListItemTitle,
} from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { useConversationRequestsListItem } from "@/features/conversation-requests-list/use-conversation-requests-list-items";
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import { useCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { useAppTheme } from "@/theme/useAppTheme";
import { useNavigation } from "@react-navigation/native";
import { useQueries } from "@tanstack/react-query";
import React, { memo, useMemo } from "react";

export const ConversationListAwaitingRequests = memo(
  function ConversationListAwaitingRequests() {
    const { theme } = useAppTheme();
    const currentAccount = useCurrentAccount()!;
    const navigation = useNavigation();
    const { likelyNotSpam, isLoading: isLoadingUknownConversations } =
      useConversationRequestsListItem();
    const { data: currentAccountInboxId } = useCurrentAccountInboxId();

    const conversationsMetadataQueries = useQueries({
      queries: (likelyNotSpam ?? []).map((conversation) =>
        getConversationMetadataQueryOptions({
          account: currentAccount,
          topic: conversation.topic,
        })
      ),
    });

    const numberOfRequestsLikelyNotSpam = useMemo(
      () => likelyNotSpam.length,
      [likelyNotSpam]
    );

    const hasUnreadMessages = useMemo(
      () =>
        conversationsMetadataQueries.some((query, index) => {
          if (!query.data) return false;
          const conversation = likelyNotSpam[index];
          return conversationIsUnreadForInboxId({
            lastMessageSent: conversation.lastMessage?.sentNs ?? null,
            lastMessageSenderInboxId:
              conversation.lastMessage?.senderInboxId ?? null,
            consumerInboxId: currentAccountInboxId!,
            markedAsUnread: query.data?.markedAsUnread ?? false,
            readUntil: query.data?.readUntil ?? 0,
          });
        }),
      [conversationsMetadataQueries, likelyNotSpam, currentAccountInboxId]
    );

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
      );
    }, [theme]);

    const subtitle = useMemo(() => {
      const getSubtitleText = () => {
        if (isLoadingUknownConversations) {
          return "Checking for invites";
        }
        if (numberOfRequestsLikelyNotSpam === 0) {
          return "All clear";
        }
        return `${numberOfRequestsLikelyNotSpam} new contact${
          numberOfRequestsLikelyNotSpam > 1 ? "s" : ""
        }`;
      };

      const text = getSubtitleText();

      return (
        <AnimatedHStack
          key={text} // Doing this to make sure the animation is triggered
          entering={theme.animation.reanimatedFadeInSpring}
          exiting={theme.animation.reanimatedFadeOutSpring}
        >
          <ConversationListItemSubtitle>{text}</ConversationListItemSubtitle>
        </AnimatedHStack>
      );
    }, [isLoadingUknownConversations, numberOfRequestsLikelyNotSpam, theme]);

    return (
      <AnimatedVStack
        layout={theme.animation.reanimatedLayoutSpringTransition}
        entering={theme.animation.reanimatedFadeInSpring}
      >
        <ConversationListItem
          title={title}
          subtitle={subtitle}
          onPress={() => {
            navigation.navigate("ChatsRequests");
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
    );
  }
);
