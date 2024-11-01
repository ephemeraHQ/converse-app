import { NavigationParamList } from "@navigation/Navigation.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { backgroundColor } from "@styles/colors";
import { showUnreadOnConversation } from "@utils/conversation/showUnreadOnConversation";
import { ConversationListContext } from "@utils/conversationList";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { useSelect } from "../data/store/storeHelpers";
import {
  ConversationFlatListHiddenRequestItem,
  ConversationFlatListItem,
  ConversationWithLastMessagePreview,
} from "../utils/conversation";
import { getPreferredAvatar, getProfile } from "../utils/profile";
import { conversationName } from "../utils/str";
import { GroupConversationItem } from "./ConversationList/GroupConversationItem";
import HiddenRequestsButton from "./ConversationList/HiddenRequestsButton";
import ConversationListItem from "./ConversationListItem";

type Props = {
  onScroll?: () => void;
  items: ConversationFlatListItem[];
  itemsForSearchQuery?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
>;

export default function ConversationFlashList({
  onScroll,
  navigation,
  route,
  items,
  itemsForSearchQuery,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  const navigationRef = useRef(navigation);
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const {
    lastUpdateAt,
    initialLoadDoneOnce,
    openedConversationTopic,
    topicsData,
  } = useChatStore(
    useSelect([
      "lastUpdateAt",
      "initialLoadDoneOnce",
      "openedConversationTopic",
      "topicsData",
    ])
  );
  const userAddress = useCurrentAccount() as string;
  const peersStatus = useSettingsStore((s) => s.peersStatus);
  const profiles = useProfilesStore((state) => state.profiles);

  const listRef = useRef<FlashList<any> | undefined>();

  const keyExtractor = useCallback((item: ConversationFlatListItem) => {
    return item.topic;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ConversationFlatListItem }) => {
      if (item.topic === "hiddenRequestsButton") {
        const hiddenRequestItem = item as ConversationFlatListHiddenRequestItem;
        return (
          <HiddenRequestsButton
            spamCount={hiddenRequestItem.spamCount}
            toggleActivated={hiddenRequestItem.toggleActivated}
          />
        );
      }
      const conversation = item as ConversationWithLastMessagePreview;
      const lastMessagePreview = conversation.lastMessagePreview;
      const socials = conversation.peerAddress
        ? getProfile(conversation.peerAddress, profiles)?.socials
        : undefined;
      if (conversation.isGroup) {
        return <GroupConversationItem conversation={conversation} />;
      }
      return (
        <ConversationListItem
          conversationPeerAddress={conversation.peerAddress}
          conversationPeerAvatar={getPreferredAvatar(socials)}
          colorScheme={colorScheme}
          conversationTopic={conversation.topic}
          conversationTime={
            lastMessagePreview?.message?.sent || conversation.createdAt
          }
          conversationName={conversationName(conversation, socials)}
          showUnread={showUnreadOnConversation(
            initialLoadDoneOnce,
            lastMessagePreview,
            topicsData,
            conversation,
            userAddress
          )}
          lastMessagePreview={
            conversation.peerAddress &&
            peersStatus[conversation.peerAddress.toLowerCase()] === "blocked"
              ? "This user is blocked"
              : lastMessagePreview
              ? lastMessagePreview.contentPreview
              : ""
          }
          lastMessageImageUrl={lastMessagePreview?.imageUrl}
          lastMessageStatus={lastMessagePreview?.message?.status}
          lastMessageFromMe={
            !!lastMessagePreview &&
            lastMessagePreview.message?.senderAddress === userAddress
          }
          conversationOpened={conversation.topic === openedConversationTopic}
          isGroupConversation={conversation.isGroup}
        />
      );
    },
    [
      colorScheme,
      initialLoadDoneOnce,
      openedConversationTopic,
      peersStatus,
      profiles,
      topicsData,
      userAddress,
    ]
  );
  return (
    <ConversationListContext.Provider
      value={{
        navigationRef,
        routeName: route.name,
        routeParams: route.params,
      }}
    >
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
            ref={(r) => {
              if (r) {
                listRef.current = r;
              }
            }}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
          />
        </View>
      </View>
    </ConversationListContext.Provider>
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
