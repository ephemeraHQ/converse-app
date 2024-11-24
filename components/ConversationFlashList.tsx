import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import { backgroundColor } from "@styles/colors";
import { ConversationListContext } from "@utils/conversationList";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import HiddenRequestsButton from "./ConversationList/HiddenRequestsButton";
import { V3GroupConversationListItem } from "./V3GroupConversationListItem";
import { useChatStore, useCurrentAccount } from "../data/store/accountsStore";
import { useSelect } from "../data/store/storeHelpers";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { ConversationFlatListHiddenRequestItem } from "../utils/conversation";
import { FlatListItemType } from "../features/conversation-list/ConversationList.types";
import { unwrapConversationContainer } from "@utils/groupUtils/conversationContainerHelpers";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import { DmWithCodecsType, GroupWithCodecsType } from "@utils/xmtpRN/client";
import { V3DMListItem } from "./V3DMListItem";

type Props = {
  onScroll?: () => void;
  items: FlatListItemType[];
  itemsForSearchQuery?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  refetch?: () => void;
  isRefetching?: boolean;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
>;

const keyExtractor = (item: FlatListItemType) => {
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
  refetch,
  isRefetching,
}: Props) {
  const navigationRef = useRef(navigation);
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const { lastUpdateAt, initialLoadDoneOnce } = useChatStore(
    useSelect(["lastUpdateAt", "initialLoadDoneOnce"])
  );
  const userAddress = useCurrentAccount() as string;
  const listRef = useRef<FlashList<any> | undefined>();

  const renderItem = useCallback(({ item }: { item: FlatListItemType }) => {
    if ("lastMessage" in item) {
      const conversation = unwrapConversationContainer(item);
      if (conversation.version === ConversationVersion.GROUP) {
        return (
          <V3GroupConversationListItem
            group={conversation as GroupWithCodecsType}
          />
        );
      } else {
        return <V3DMListItem conversation={conversation as DmWithCodecsType} />;
      }
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
    return null;
  }, []);

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
            onRefresh={refetch}
            refreshing={isRefetching}
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
