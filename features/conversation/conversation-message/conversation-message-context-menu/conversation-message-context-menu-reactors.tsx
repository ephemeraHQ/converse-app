import { GroupAvatarMembers } from "@/components/group-avatar";
import { AnimatedCenter, Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { useCurrentConversationTopicSafe } from "@/features/conversation/conversation.store-context";
import { useGroupMembersInfoForCurrentAccount } from "@/hooks/use-group-members-info-for-current-account";
import { ObjectTyped } from "@/utils/object-typed";
import { getReactionContent } from "@/utils/xmtpRN/reactions";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import { InboxId, ReactionContent } from "@xmtp/react-native-sdk";
import React, { FC, memo, useMemo } from "react";
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageContextMenuReactorsProps = {
  reactors: {
    [reactor: InboxId]: ReactionContent[];
  };
};

export const MessageContextMenuReactors: FC<
  MessageContextMenuReactorsProps
> = ({ reactors }) => {
  const { theme } = useAppTheme();

  const safeAreaInsets = useSafeAreaInsets();

  const listData = useMemo(() => {
    if (!reactors) {
      return [];
    }

    const reactionMap: Record<string, InboxId[]> = {};
    ObjectTyped.entries(reactors).forEach(([reactorInboxId, reactions]) => {
      if (!reactions || reactions.length === 0) {
        return;
      }
      for (const reaction of reactions) {
        if (!reactionMap[getReactionContent(reaction)]) {
          reactionMap[getReactionContent(reaction)] = [];
        }
        reactionMap[getReactionContent(reaction)].push(
          reactorInboxId as InboxId
        );
      }
    });
    return Object.entries(reactionMap);
  }, [reactors]);

  return (
    <AnimatedCenter
      vertical
      entering={theme.animation.reanimatedFadeInScaleIn()}
      style={{
        position: "absolute",
        top: safeAreaInsets.top + theme.spacing.xs,
        left: 0,
        right: 0,
      }}
    >
      <FlatList
        data={listData}
        horizontal
        contentContainerStyle={{
          borderRadius: theme.spacing.lg,
          backgroundColor: theme.colors.background.raised,
          padding: theme.spacing.sm,
          columnGap: theme.spacing.sm,
        }}
        renderItem={({ item: [content, inboxIds], index }) => (
          <Item content={content} inboxIds={inboxIds} />
        )}
        keyExtractor={(item) => item[0]}
        showsHorizontalScrollIndicator={false}
      />
    </AnimatedCenter>
  );
};

type MessageReactionsItemProps = {
  content: string;
  inboxIds: InboxId[];
};

const Item = memo(function Item({
  content,
  inboxIds,
}: MessageReactionsItemProps) {
  const { theme } = useAppTheme();

  const conversationTopic = useCurrentConversationTopicSafe();

  const { groupMembersInfo } = useGroupMembersInfoForCurrentAccount({
    groupTopic: conversationTopic,
  });

  return (
    <Center
      vertical
      style={{
        rowGap: theme.spacing.xxs,
      }}
    >
      <GroupAvatarMembers
        size={theme.avatarSize.lg}
        members={groupMembersInfo}
      />
      <HStack
        style={{
          alignItems: "center",
          columnGap: theme.spacing.xxxs,
        }}
      >
        <Text>{content}</Text>
        <Text color="secondary" preset="small">
          {inboxIds.length}
        </Text>
      </HStack>
    </Center>
  );
});
