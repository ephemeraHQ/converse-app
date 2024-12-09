import { MESSAGE_CONTEXT_REACTIONS_HEIGHT } from "@/components/Chat/Message/message-context-menu/message-context-menu-constant";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { ObjectTyped } from "@/utils/objectTyped";
import GroupAvatar from "@components/GroupAvatar";
import { useProfilesStore } from "@data/store/accountsStore";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import { getReactionContent } from "@/utils/xmtpRN/reactions";
import { InboxId, ReactionContent } from "@xmtp/react-native-sdk";
import React, { FC, useEffect, useMemo } from "react";
import { FlatList } from "react-native-gesture-handler";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
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
    ObjectTyped.entries(reactors).forEach(([reactorAddress, reactions]) => {
      if (!reactions || reactions.length === 0) {
        return;
      }
      for (const reaction of reactions) {
        if (!reactionMap[getReactionContent(reaction)]) {
          reactionMap[getReactionContent(reaction)] = [];
        }
        reactionMap[getReactionContent(reaction)].push(
          reactorAddress as InboxId
        );
      }
    });
    return Object.entries(reactionMap);
  }, [reactors]);

  return (
    <VStack
      // {...debugBorder()}
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
          renderItem={({ item: [content, addresses], index }) => (
            <Item content={content} addresses={addresses} index={index} />
          )}
          keyExtractor={(item) => item[0]}
          showsHorizontalScrollIndicator={false}
        />
      </VStack>
    </VStack>
  );
};

const INITIAL_DELAY = 0;
const ITEM_DELAY = 200;
const ITEM_ANIMATION_DURATION = 500;

type MessageReactionsItemProps = {
  content: string;
  addresses: string[];
  index: number;
};

const Item: FC<MessageReactionsItemProps> = ({ content, addresses, index }) => {
  const { theme } = useAppTheme();

  const animatedValue = useSharedValue(0);

  const membersSocials = useProfilesStore((s) =>
    addresses.map((address) => {
      const socials = getProfile(address, s.profiles)?.socials;
      return {
        address,
        uri: getPreferredAvatar(socials),
        name: getPreferredName(socials, address),
      };
    })
  );

  useEffect(() => {
    animatedValue.value = withDelay(
      index * ITEM_DELAY + INITIAL_DELAY,
      withTiming(1, {
        duration: ITEM_ANIMATION_DURATION,
        easing: Easing.out(Easing.exp),
      })
    );
  }, [animatedValue, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ scale: animatedValue.value }],
  }));

  return (
    <AnimatedVStack
      style={[
        {
          justifyContent: "center",
          alignItems: "center",
          width: 76, // From iMessage
          height: MESSAGE_CONTEXT_REACTIONS_HEIGHT, // From iMessage
        },
        animatedStyle,
      ]}
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
        {content} {addresses.length}
      </Text>
    </AnimatedVStack>
  );
};
