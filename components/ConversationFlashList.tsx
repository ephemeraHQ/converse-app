import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { backgroundColor } from "@styles/colors";
import { showUnreadOnConversation } from "@utils/conversation/showUnreadOnConversation";
import { ConversationListContext } from "@utils/conversationList";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import HiddenRequestsButton from "./ConversationList/HiddenRequestsButton";
import ConversationListItem from "./ConversationListItem";
import { V3GroupConversationListItem } from "./V3GroupConversationListItem";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { useSelect } from "../data/store/storeHelpers";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import {
  ConversationFlatListHiddenRequestItem,
  ConversationFlatListItem,
  ConversationWithLastMessagePreview,
} from "../utils/conversation";
import { getPreferredAvatar, getProfile } from "../utils/profile";
import { conversationName } from "../utils/str";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";

type Props = {
  onScroll?: () => void;
  items: (ConversationFlatListItem | GroupWithCodecsType)[];
  itemsForSearchQuery?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
>;

const keyExtractor = (item: ConversationFlatListItem | GroupWithCodecsType) => {
  if ("lastMessage" in item) {
    return item.topic;
  }
  return typeof item === "string" ? item : item.topic + "v2";
};

export default function ConversationFlashList({
  onScroll,
  navigation,
  route,
  items,
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

  const renderItem = useCallback(
    ({ item }: { item: ConversationFlatListItem | GroupWithCodecsType }) => {
      if ("lastMessage" in item) {
        return <V3GroupConversationListItem group={item} />;
      }
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
        return null;
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
