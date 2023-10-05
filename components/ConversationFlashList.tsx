import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { useCallback } from "react";
import { Platform, View, useColorScheme, StyleSheet } from "react-native";

import {
  useChatStore,
  useSettingsStore,
  useUserStore,
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
import EphemeralAccountBanner from "./EphemeralAccountBanner";
import NoResult from "./Search/NoResult";
import Welcome from "./Welcome";

type Props = {
  onScroll?: () => void;
  showNoResult?: boolean;
  items: ConversationFlatListItem[];
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
} & NativeStackScreenProps<NavigationParamList, any>;

export default function ConversationFlashList({
  onScroll,
  navigation,
  route,
  items,
  showNoResult,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const {
    lastUpdateAt,

    initialLoadDoneOnce,
  } = useChatStore((s) => pick(s, ["initialLoadDoneOnce", "lastUpdateAt"]));
  const userAddress = useUserStore((s) => s.userAddress);
  const { blockedPeers } = useSettingsStore((s) => pick(s, ["blockedPeers"]));

  const keyExtractor = useCallback((item: ConversationFlatListItem) => {
    return item.topic;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ConversationFlatListItem }) => {
      if (item.topic === "welcome") {
        return <Welcome ctaOnly navigation={navigation} route={route} />;
      } else if (item.topic === "noresult") {
        return <NoResult navigation={navigation} />;
      } else if (item.topic === "ephemeral") {
        return <EphemeralAccountBanner />;
      }
      const conversation = item as ConversationWithLastMessagePreview;
      const lastMessagePreview = conversation.lastMessagePreview;
      return (
        <ConversationListItem
          navigation={navigation}
          conversation={conversation}
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
            blockedPeers[conversation.peerAddress.toLowerCase()]
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
    [
      colorScheme,
      navigation,
      route,
      userAddress,
      blockedPeers,
      initialLoadDoneOnce,
    ]
  );
  return (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <FlashList
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={onScroll}
          onScrollBeginDrag={onScroll}
          alwaysBounceVertical={false}
          contentInsetAdjustmentBehavior="automatic"
          data={ListFooterComponent ? [] : items}
          extraData={[
            colorScheme,
            navigation,
            route,
            userAddress,
            blockedPeers,
            initialLoadDoneOnce,
            lastUpdateAt,
          ]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={
            ListFooterComponent ||
            (showNoResult ? <NoResult navigation={navigation} /> : null)
          }
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
