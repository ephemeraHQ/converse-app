import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { MESSAGE_CONTEXT_REACTIONS_HEIGHT } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu-constant";
import { useInboxProfileSocialsQueries } from "@/queries/useInboxProfileSocialsQuery";
import { ObjectTyped } from "@/utils/objectTyped";
import { getReactionContent } from "@/utils/xmtpRN/reactions";
import GroupAvatar from "@components/GroupAvatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import { getPreferredInboxAvatar, getPreferredInboxName } from "@utils/profile";
import { InboxId, ReactionContent } from "@xmtp/react-native-sdk";
import React, { FC, useMemo } from "react";
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
    <AnimatedVStack
      // {...debugBorder()}
      entering={theme.animation.reanimatedFadeInScaleIn()}
      style={{
        position: "absolute",
        top: safeAreaInsets.top + theme.spacing.xs,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "box-none",
      }}
    >
      <VStack
        style={{
          borderRadius: theme.spacing.sm,
          backgroundColor: theme.colors.background.raised,
        }}
      >
        <FlatList
          data={listData}
          horizontal
          renderItem={({ item: [content, inboxIds], index }) => (
            <Item content={content} inboxIds={inboxIds} />
          )}
          keyExtractor={(item) => item[0]}
          showsHorizontalScrollIndicator={false}
        />
      </VStack>
    </AnimatedVStack>
  );
};

type MessageReactionsItemProps = {
  content: string;
  inboxIds: InboxId[];
};

const Item: FC<MessageReactionsItemProps> = ({ content, inboxIds }) => {
  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount()!;

  const queriesData = useInboxProfileSocialsQueries(currentAccount, inboxIds);

  const membersSocials = queriesData.map(({ data: socials }, index) => {
    return {
      address: inboxIds[index],
      uri: getPreferredInboxAvatar(socials),
      name: getPreferredInboxName(socials),
    };
  });

  return (
    <AnimatedVStack
      style={{
        justifyContent: "center",
        alignItems: "center",
        width: 76, // From iMessage
        height: MESSAGE_CONTEXT_REACTIONS_HEIGHT, // From iMessage
      }}
    >
      <VStack
        style={{
          height: theme.avatarSize.lg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <GroupAvatar
          pendingGroupMembers={membersSocials}
          size={theme.avatarSize.lg}
        />
      </VStack>
      <Text style={{ marginTop: theme.spacing.md }}>
        {content} {inboxIds.length}
      </Text>
    </AnimatedVStack>
  );
};
