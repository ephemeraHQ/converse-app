import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { useCallback } from "react";
import { Platform, View, useColorScheme, StyleSheet } from "react-native";

import {
  useChatStore,
  useCurrentAccount,
  useSettingsStore,
} from "../data/store/accountsStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { backgroundColor } from "../utils/colors";
import {
  ConversationFlatListItem,
  ConversationWithLastMessagePreview,
} from "../utils/conversation";
import { pick } from "../utils/objects";
import { conversationName } from "../utils/str";
import ConversationListItem from "./ConversationListItem";

type Props = {
  onScroll?: () => void;
  items: ConversationFlatListItem[];
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
} & NativeStackScreenProps<NavigationParamList, any>;

export default function ConversationFlashList({
  onScroll,
  navigation,
  route,
  items,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const { lastUpdateAt, initialLoadDoneOnce } = useChatStore((s) =>
    pick(s, ["initialLoadDoneOnce", "lastUpdateAt"])
  );
  const userAddress = useCurrentAccount() as string;
  const { peersStatus } = useSettingsStore((s) => pick(s, ["peersStatus"]));

  const keyExtractor = useCallback((item: ConversationFlatListItem) => {
    return item.topic;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ConversationFlatListItem }) => {
      const conversation = item as ConversationWithLastMessagePreview;
      const lastMessagePreview = conversation.lastMessagePreview;
      return (
        <ConversationListItem
          navigation={navigation}
          conversationPeerAddress={conversation.peerAddress}
          colorScheme={colorScheme}
          conversationTopic={conversation.topic}
          conversationTime={
            lastMessagePreview?.message?.sent || conversation.createdAt
          }
          conversationName={conversationName(conversation)}
          showUnread={
            !!(
              initialLoadDoneOnce &&
              lastMessagePreview &&
              conversation.readUntil < lastMessagePreview.message.sent &&
              lastMessagePreview.message.senderAddress ===
                conversation.peerAddress
            )
          }
          lastMessagePreview={
            peersStatus[conversation.peerAddress.toLowerCase()] === "blocked"
              ? "This user is blocked"
              : lastMessagePreview
              ? lastMessagePreview.contentPreview
              : ""
          }
          lastMessageStatus={lastMessagePreview?.message?.status}
          lastMessageFromMe={
            !!lastMessagePreview &&
            lastMessagePreview.message?.senderAddress === userAddress
          }
        />
      );
    },
    [colorScheme, initialLoadDoneOnce, navigation, peersStatus, userAddress]
  );
  return (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <FlashList
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={onScroll}
          onScrollBeginDrag={onScroll}
          alwaysBounceVertical={items.length > 0}
          contentInsetAdjustmentBehavior="automatic"
          data={items}
          extraData={[
            colorScheme,
            navigation,
            route,
            userAddress,
            initialLoadDoneOnce,
            lastUpdateAt,
          ]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
        />
      </View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    conversationList: {
      flex: 1,
    },
  });
};
