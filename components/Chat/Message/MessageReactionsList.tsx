import GroupAvatar from "@components/GroupAvatar";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
} from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import {
  backgroundColor,
  clickedItemBackgroundColor,
  messageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes, BorderRadius, Paddings } from "@styles/sizes";
import { useConversationContext } from "@utils/conversation";
import { favoritedEmojis } from "@utils/emojis/favoritedEmojis";
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
  Text,
  useColorScheme,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
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
    [senderAddress: string]: MessageReaction[];
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
const SIDE_MARGIN = 15;

const keyExtractor = (item: [string, string[]]) => item[0];

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
  alreadySelected: boolean;
  dismissMenu?: () => void;
}> = ({ content, message, alreadySelected, dismissMenu }) => {
  const styles = useStyles();
  const { conversation } = useConversationContext(["conversation"]);
  const handlePress = useCallback(() => {
    if (!conversation) {
      return;
    }
    if (alreadySelected) {
      removeReactionFromMessage(conversation, message, content);
    } else {
      addReactionToMessage(conversation, message, content);
    }
    dismissMenu?.();
  }, [alreadySelected, content, conversation, dismissMenu, message]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text
        style={[
          styles.emojiText,
          alreadySelected ? styles.selectedEmojiText : undefined,
        ]}
      >
        {content}
      </Text>
    </TouchableOpacity>
  );
};

const MessageReactionsListInner: FC<MessageReactionsListProps> = ({
  reactions,
  message,
  dismissMenu,
}) => {
  const { setReactMenuMessageId } = useChatStore(
    useSelect(["setReactMenuMessageId"])
  );
  const currentUser = useCurrentAccount();
  const styles = useStyles();
  const colorScheme = useColorScheme();
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

  const renderItem: ListRenderItem<[string, string[]]> = ({ item, index }) => {
    return <Item content={item[0]} addresses={item[1]} index={index} />;
  };

  const handlePlusPress = useCallback(() => {
    dismissMenu?.();
    setReactMenuMessageId(message.id);
  }, [dismissMenu, message.id, setReactMenuMessageId]);

  return (
    <View
      style={[
        styles.container,
        message.fromMe ? styles.fromMeContainer : styles.fromOtherContainer,
      ]}
    >
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
          message.fromMe
            ? styles.emojiListContainerFromMe
            : styles.emojiListContainerFromOther,
        ]}
      >
        {favoritedEmojis.getEmojis().map((emoji) => (
          <EmojiItem
            key={emoji}
            content={emoji}
            alreadySelected={currentUserEmojiMap[emoji]}
            message={message}
            dismissMenu={dismissMenu}
          />
        ))}
        <TouchableOpacity onPress={handlePlusPress}>
          <View style={styles.plusContainer}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const MessageReactionsList = React.memo(MessageReactionsListInner);

const useStyles = () => {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

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
      textAlignVertical: "center",
      fontSize: 24,
      marginHorizontal: 2,
      padding: 2,
    },
    selectedEmojiText: {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      borderRadius: 10,
      overflow: "hidden",
    },
    container: {
      flexGrow: 1,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      width,
    },
    fromMeContainer: {
      right: -2 * SIDE_MARGIN,
    },
    fromOtherContainer: {
      left: -2 * SIDE_MARGIN,
    },
    reactionsContainer: {
      flex: 1,
      borderRadius: BorderRadius.large,
      margin: Paddings.default,
    },
    flex1: {
      flex: 1,
    },
    emojiListContainer: {
      height: 70,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      borderRadius: BorderRadius.large,
      padding: Paddings.default,
      marginVertical: Platform.OS === "android" ? 0 : Paddings.large,
      backgroundColor: backgroundColor(colorScheme),
    },
    emojiListContainerFromMe: {
      alignSelf: "flex-end",
      marginRight: SIDE_MARGIN * 2,
    },
    emojiListContainerFromOther: {
      alignSelf: "flex-start",
      marginLeft: SIDE_MARGIN * 2,
    },
    plusContainer: {
      borderRadius: 32,
      backgroundColor: clickedItemBackgroundColor(colorScheme),
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      textAlignVertical: "center",
      height: 32,
      width: 32,
    },
    plusText: {
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 16,
      color: textPrimaryColor(colorScheme),
    },
  });
};
