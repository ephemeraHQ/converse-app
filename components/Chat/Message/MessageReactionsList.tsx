import GroupAvatar from "@components/GroupAvatar";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
} from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
  tertiaryBackgroundColor,
} from "@styles/colors";
import { AvatarSizes, BorderRadius, Paddings, Margins } from "@styles/sizes";
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
  ListRenderItem,
  Text,
  useColorScheme,
  View,
  StyleSheet,
  TouchableOpacity,
  InteractionManager,
} from "react-native";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MessageToDisplay } from "./Message";
import Picto from "../../Picto/Picto";

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

const INITIAL_DELAY = 0;
const ITEM_DELAY = 200;
const ITEM_ANIMATION_DURATION = 500;

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
      <View
        style={{
          height: AvatarSizes.reactionsOverlay,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <GroupAvatar
          pendingGroupMembers={membersSocials}
          size={AvatarSizes.reactionsOverlay}
        />
      </View>
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
  currentUser: string;
}> = ({ content, message, alreadySelected, currentUser }) => {
  const styles = useStyles();
  const handlePress = useCallback(() => {
    if (alreadySelected) {
      removeReactionFromMessage(currentUser, message, content);
    } else {
      addReactionToMessage(currentUser, message, content);
    }
  }, [alreadySelected, content, currentUser, message]);

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
      <View
        style={[
          styles.emojiContainer,
          alreadySelected && styles.selectedEmojiText,
        ]}
      >
        <Text style={styles.emojiText}>{content}</Text>
      </View>
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
  const currentUser = useCurrentAccount() as string;
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
  const hasEmojiOverlay = list.length !== 0;

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
    setReactMenuMessageId(message.id);
    InteractionManager.runAfterInteractions(() => {
      dismissMenu?.();
    });
  }, [dismissMenu, message.id, setReactMenuMessageId]);

  return (
    <View style={styles.container}>
      {list.length !== 0 ? (
        <Portal>
          <View style={styles.portalContainer}>
            <GestureHandlerRootView>
              <FlatList
                contentContainerStyle={styles.reactionsContainer}
                data={list}
                horizontal
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsHorizontalScrollIndicator={false}
              />
            </GestureHandlerRootView>
          </View>
        </Portal>
      ) : (
        <View style={styles.flex1} />
      )}
      {hasEmojiOverlay && <View style={styles.flexGrow} />}
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
          <View style={styles.plusContainer}>
            <Picto
              picto="plus"
              size={10}
              color={textPrimaryColor(colorScheme)}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const MessageReactionsList = React.memo(MessageReactionsListInner);

const useStyles = () => {
  const colorScheme = useColorScheme();
  const safeAreaInsets = useSafeAreaInsets();

  return StyleSheet.create({
    itemContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: 76,
      height: 119.5,
    },
    itemText: {
      color: textSecondaryColor(colorScheme),
      fontSize: 16,
      lineHeight: 20,
      marginTop: 20,
    },
    flexGrow: {
      flexGrow: 1,
      height: "auto",
    },
    emojiText: {
      textAlignVertical: "center",
      fontSize: 24,
    },
    selectedEmojiText: {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      borderRadius: 10,
      overflow: "hidden",
    },
    container: {
      flex: 1,
    },
    portalContainer: {
      position: "absolute",
      top: safeAreaInsets.top + 10,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "box-none",
    },
    reactionsContainer: {
      borderRadius: BorderRadius.large,
      backgroundColor: backgroundColor(colorScheme),
      height: 120,
    },
    flex1: {
      flex: 1,
    },
    emojiListContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      borderRadius: BorderRadius.large,
      padding: Paddings.small,
      marginVertical: Margins.small,
      backgroundColor: backgroundColor(colorScheme),
    },
    emojiListContainerFromMe: {
      alignSelf: "flex-end",
    },
    emojiListContainerFromOther: {
      alignSelf: "flex-start",
    },
    emojiContainer: {
      height: 32,
      width: 32,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 4,
    },
    plusContainer: {
      borderRadius: 32,
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      justifyContent: "center",
      alignItems: "center",
      height: 32,
      width: 32,
    },
  });
};
