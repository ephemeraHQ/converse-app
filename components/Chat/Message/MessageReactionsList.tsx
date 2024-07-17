import { getReactionContent, MessageReaction } from "@utils/reactions";
import React, { FC, useMemo } from "react";
import { FlatList, ListRenderItem, View, Text } from "react-native";

interface MessageReactionsListProps {
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
}

const keyExtractor = (item: [string, string[]]) => item[0];

export const MessageReactionsList: FC<MessageReactionsListProps> = ({
  reactions,
}) => {
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

  const renderItem: ListRenderItem<[string, string[]]> = ({ item }) => {
    return (
      <View>
        <Text>{item[0]}</Text>
        {item[1].map((senderAddress) => (
          <Text key={senderAddress}>{senderAddress}</Text>
        ))}
      </View>
    );
  };

  return (
    <FlatList
      data={list}
      horizontal
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  );
};
