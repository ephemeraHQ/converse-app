import GroupAvatar from "@components/GroupAvatar";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import { messageBubbleColor } from "@styles/colors";
import { AvatarSizes, BorderRadius, Paddings } from "@styles/sizes";
import { getReactionContent, MessageReaction } from "@utils/reactions";
import React, { FC, useMemo, useEffect, useRef, useCallback } from "react";
import {
  FlatList,
  ListRenderItem,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

interface MessageReactionsListProps {
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
}

interface MessageReactionsItemProps {
  content: string;
  addresses: string[];
  animatedValue: SharedValue<number>;
}

const keyExtractor = (item: [string, string[]]) => item[0];

const Item: FC<MessageReactionsItemProps> = ({
  content,
  addresses,
  animatedValue,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ scale: animatedValue.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          justifyContent: "center",
          alignItems: "center",
          padding: Paddings.small,
        },
        animatedStyle,
      ]}
    >
      <GroupAvatar
        pendingGroupMembers={addresses.map((address) => ({ address }))}
        size={AvatarSizes.pinnedConversation}
      />
      <Text style={{ paddingTop: Paddings.small }}>
        {content} {addresses.length}
      </Text>
    </Animated.View>
  );
};

export const MessageReactionsList: FC<MessageReactionsListProps> = ({
  reactions,
}) => {
  const colorScheme = useColorScheme();
  const { contextMenuShown } = useAppStore(useSelect(["contextMenuShown"]));
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedValues = useRef(list.map(() => useSharedValue(0))).current;

  useEffect(() => {
    animatedValues.forEach((animatedValue, index) => {
      animatedValue.value = withDelay(
        index * 200,
        withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        })
      );
    });
  }, [animatedValues]);

  const renderItem: ListRenderItem<[string, string[]]> = ({ item, index }) => {
    return (
      <Item
        content={item[0]}
        addresses={item[1]}
        animatedValue={animatedValues[index]}
      />
    );
  };

  const collapseItems = useCallback(() => {
    animatedValues.forEach((animatedValue, index) => {
      if (index !== 0) {
        animatedValue.value = withTiming(0, {
          duration: 500,
          easing: Easing.in(Easing.exp),
        });
      } else {
        animatedValue.value = withTiming(1, {
          duration: 500,
          easing: Easing.in(Easing.exp),
        });
      }
    });
  }, [animatedValues]);

  useEffect(() => {
    if (!contextMenuShown) {
      collapseItems();
    }
  }, [collapseItems, contextMenuShown]);
  if (list.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: messageBubbleColor(colorScheme),
        borderRadius: BorderRadius.large,
        padding: Paddings.default,
      }}
    >
      <FlatList
        data={list}
        horizontal
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </View>
  );
};
