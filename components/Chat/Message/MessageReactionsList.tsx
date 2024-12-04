import { HStack } from "@/design-system/HStack";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import GroupAvatar from "@components/GroupAvatar";
import Picto from "@components/Picto/Picto";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
} from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import { favoritedEmojis } from "@utils/emojis/favoritedEmojis";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import { MessageReaction, getReactionContent } from "@utils/reactions";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";
import React, { FC, useCallback, useEffect, useMemo } from "react";
import {
  InteractionManager,
  ListRenderItem,
  TouchableOpacity,
} from "react-native";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageReactionsListProps = {
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
  messageTopic: ConversationTopic;
  messageId: MessageId;
  messageFromMe: boolean;
  dismissMenu?: () => void;
};

export const MessageReactionsList: FC<MessageReactionsListProps> = ({
  reactions,
  messageTopic,
  messageId,
  messageFromMe,
  dismissMenu,
}) => {
  const { setReactingToMessage } = useChatStore(
    useSelect(["setReactingToMessage"])
  );
  const currentUser = useCurrentAccount() as string;
  const safeAreaInsets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const list = useMemo(() => {
    const reactionMap: Record<string, string[]> = {};
    Object.entries(reactions).forEach(([senderAddress, reactions]) => {
      if (!reactions || reactions.length === 0) {
        return;
      }
      for (const reaction of reactions) {
        if (!reactionMap[getReactionContent(reaction)]) {
          reactionMap[getReactionContent(reaction)] = [];
        }
        reactionMap[getReactionContent(reaction)].push(senderAddress);
      }
    });
    return Object.entries(reactionMap);
  }, [reactions]);

  const currentUserEmojiMap = useMemo(() => {
    const emojiSet: Record<string, boolean> = {};
    if (!currentUser) {
      return emojiSet;
    }
    const userReactions = reactions[currentUser];
    if (!userReactions) {
      return emojiSet;
    }
    for (const reaction of userReactions) {
      emojiSet[getReactionContent(reaction)] = true;
    }
    return emojiSet;
  }, [reactions, currentUser]);

  const renderItem: ListRenderItem<[string, string[]]> = useCallback(
    ({ item, index }) => {
      return <Item content={item[0]} addresses={item[1]} index={index} />;
    },
    []
  );

  const handlePlusPress = useCallback(() => {
    setReactingToMessage({ topic: messageTopic, messageId });
    InteractionManager.runAfterInteractions(() => {
      dismissMenu?.();
    });
  }, [dismissMenu, messageTopic, messageId, setReactingToMessage]);

  return (
    <VStack
      style={{
        flex: 1,
      }}
    >
      {list.length !== 0 ? (
        <Portal>
          <VStack
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
            <GestureHandlerRootView>
              <VStack
                style={{
                  borderRadius: theme.spacing.sm,
                  backgroundColor: theme.colors.background.raised,
                }}
              >
                <FlatList
                  data={list}
                  horizontal
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  showsHorizontalScrollIndicator={false}
                />
              </VStack>
            </GestureHandlerRootView>
          </VStack>
        </Portal>
      ) : (
        <VStack
          style={{
            flex: 1,
          }}
        />
      )}
      <HStack
        style={[
          {
            justifyContent: "space-around",
            alignItems: "center",
            borderRadius: theme.spacing.lg,
            padding: theme.spacing.xxs,
            backgroundColor: theme.colors.background.raised,
          },
          messageFromMe
            ? { alignSelf: "flex-end" }
            : { alignSelf: "flex-start" },
        ]}
      >
        {favoritedEmojis.getEmojis().map((emoji) => (
          <EmojiItem
            key={emoji}
            content={emoji}
            alreadySelected={currentUserEmojiMap[emoji]}
            currentUser={currentUser}
            dismissMenu={dismissMenu}
          />
        ))}
        <TouchableOpacity
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
          onPress={handlePlusPress}
        >
          <VStack
            style={{
              height: theme.spacing.xxl,
              width: theme.spacing.xxl,
              borderRadius: theme.spacing.sm,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Picto picto="plus" size={24} color={theme.colors.text.secondary} />
          </VStack>
        </TouchableOpacity>
      </HStack>
    </VStack>
  );
};

type MessageReactionsItemProps = {
  content: string;
  addresses: string[];
  index: number;
};

const INITIAL_DELAY = 0;
const ITEM_DELAY = 200;
const ITEM_ANIMATION_DURATION = 500;

const keyExtractor = (item: [string, string[]]) => item[0];

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
          width: 76,
          height: 119.5,
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
      <Text style={{ marginTop: 20 }}>
        {content} {addresses.length}
      </Text>
    </AnimatedVStack>
  );
};

// Small emoji picker
const EmojiItem: FC<{
  content: string;

  alreadySelected: boolean;
  dismissMenu?: () => void;
  currentUser: string;
}> = ({ content, alreadySelected, dismissMenu, currentUser }) => {
  const { theme } = useAppTheme();

  const handlePress = useCallback(() => {
    if (alreadySelected) {
      // removeReactionFromMessage(currentUser, message, content);
    } else {
      // addReactionToMessage(currentUser, message, content);
    }
    InteractionManager.runAfterInteractions(() => {
      dismissMenu?.();
    });
  }, [alreadySelected, dismissMenu]);

  return (
    <TouchableOpacity
      hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      }}
      onPress={handlePress}
    >
      <VStack
        style={[
          {
            height: theme.spacing.xxl,
            width: theme.spacing.xxl,
            justifyContent: "center",
            alignItems: "center",
            marginRight: theme.spacing["4xs"],
          },
          alreadySelected && {
            backgroundColor: theme.colors.fill.minimal,
            borderRadius: theme.spacing.sm,
          },
        ]}
      >
        <Text preset="emojiSymbol">{content}</Text>
      </VStack>
    </TouchableOpacity>
  );
};
