import GroupAvatar from "@components/GroupAvatar";
import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { messageBubbleColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes, BorderRadius, Paddings } from "@styles/sizes";
import { useConversationContext } from "@utils/conversation";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import {
  addReactionToMessage,
  getReactionContent,
  MessageReaction,
  removeReactionFromMessage,
} from "@utils/reactions";
import React, { FC, useMemo, useEffect, useCallback } from "react";
import {
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  useColorScheme,
  View,
  StyleSheet,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { MessageToDisplay } from "./Message";

interface MessageReactionsListProps {
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
  message: MessageToDisplay;
  dismissMenu?: () => void;
}

interface MessageReactionsItemProps {
  content: string;
  addresses: string[];
  index: number;
}

const INITIAL_DELAY = 800;
const ITEM_DELAY = 200;
const ITEM_ANIMATION_DURATION = 500;

const keyExtractor = (item: [string, string[]]) => item[0];
const emojiKeyExtractor = (item: string) => item;

const Item: FC<MessageReactionsItemProps> = ({ content, addresses, index }) => {
  const styles = useStyles();
  const animatedValue = useSharedValue(0);
  const membersSocials = useProfilesStore((s) =>
    addresses.map((address) => {
      const socials = s.profiles[address]?.socials;
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
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <GroupAvatar
        pendingGroupMembers={membersSocials}
        size={AvatarSizes.pinnedConversation}
      />
      <Text style={styles.itemText}>
        {content} {addresses.length}
      </Text>
    </Animated.View>
  );
};

const EmojiItem: FC<{
  content: string;
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
  dismissMenu?: () => void;
}> = ({ content, message, reactions, dismissMenu }) => {
  const styles = useStyles();
  const { conversation } = useConversationContext(["conversation"]);
  const userAddress = useCurrentAccount() as string;
  const alreadySelected = reactions[userAddress]?.content === content;
  const handlePress = useCallback(() => {
    if (!conversation) {
      return;
    }
    if (alreadySelected) {
      removeReactionFromMessage(conversation, message, content);
    } else {
      // We want to remove all emojis first
      const myReaction = reactions[userAddress];
      if (myReaction && myReaction.schema === "unicode") {
        removeReactionFromMessage(conversation, message, myReaction.content);
      }
      addReactionToMessage(conversation, message, content);
    }
    dismissMenu?.();
  }, [
    alreadySelected,
    content,
    conversation,
    dismissMenu,
    message,
    reactions,
    userAddress,
  ]);

  return (
    <View style={styles.flexGrow}>
      <Pressable onPress={handlePress}>
        <Text style={styles.emojiText}>{content}</Text>
      </Pressable>
    </View>
  );
};

const emojiList = ["❤️", "👍", "👎", "😂", "🤔", "😲", "➕"];

export const MessageReactionsList: FC<MessageReactionsListProps> = ({
  reactions,
  message,
  dismissMenu,
}) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const list = useMemo(() => {
    const reactionMap: Record<string, string[]> = {};
    Object.entries(reactions).forEach(([senderAddress, reaction]) => {
      if (!reaction) {
        return;
      }
      if (!reactionMap[getReactionContent(reaction)]) {
        reactionMap[getReactionContent(reaction)] = [];
      }
      reactionMap[getReactionContent(reaction)].push(senderAddress);
    });
    return Object.entries(reactionMap);
  }, [reactions]);

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, [animatedValue]);

  const renderItem: ListRenderItem<[string, string[]]> = ({ item, index }) => {
    return <Item content={item[0]} addresses={item[1]} index={index} />;
  };

  const emojiRenderItem: ListRenderItem<string> = ({ item }) => {
    return (
      <EmojiItem
        content={item}
        reactions={reactions}
        message={message}
        dismissMenu={dismissMenu}
      />
    );
  };

  return (
    <View style={styles.container}>
      {list.length !== 0 ? (
        <View
          style={[
            styles.reactionsContainer,
            { backgroundColor: messageBubbleColor(colorScheme) },
          ]}
        >
          <FlatList
            data={list}
            horizontal
            renderItem={renderItem}
            keyExtractor={keyExtractor}
          />
        </View>
      ) : (
        <View style={styles.flex1} />
      )}
      <View
        style={[
          styles.emojiListContainer,
          {
            backgroundColor: messageBubbleColor(colorScheme),
            marginVertical: Paddings.large,
          },
        ]}
      >
        <FlatList
          data={emojiList}
          horizontal
          renderItem={emojiRenderItem}
          keyExtractor={emojiKeyExtractor}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();

  return StyleSheet.create({
    itemContainer: {
      justifyContent: "center",
      alignItems: "center",
      padding: Paddings.small,
    },
    itemText: {
      paddingTop: Paddings.small,
      color: textSecondaryColor(colorScheme),
    },
    flexGrow: {
      flexGrow: 1,
    },
    emojiText: {
      fontSize: 24,
      padding: Paddings.small,
    },
    container: {
      justifyContent: "space-between",
      width: 300,
    },
    reactionsContainer: {
      borderRadius: BorderRadius.large,
      padding: Paddings.default,
    },
    flex1: {
      flex: 1,
    },
    emojiListContainer: {
      borderRadius: BorderRadius.large,
      padding: Paddings.default,
      flexShrink: 1,
    },
  });
};
