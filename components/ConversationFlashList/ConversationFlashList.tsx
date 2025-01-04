import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { backgroundColor } from "@styles/colors";
import { useCallback, useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { AnimatedVStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { FlatListItemType } from "@features/conversation-list/ConversationList.types";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { ConversationFlatListHiddenRequestItem } from "@utils/conversation";
import { unwrapConversationContainer } from "@utils/groupUtils/conversationContainerHelpers";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import Animated from "react-native-reanimated";
import HiddenRequestsButton from "../ConversationList/HiddenRequestsButton";
import { V3DMListItem } from "../V3DMListItem";
import { V3GroupConversationListItem } from "../V3GroupConversationListItem";
import { CONVERSATION_FLASH_LIST_REFRESH_THRESHOLD } from "./ConversationFlashList.constants";

type Props = {
  onScroll?: () => void;
  items: FlatListItemType[];
  itemsForSearchQuery?: string;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  refetch?: () => Promise<unknown>;
  isRefetching?: boolean;
} & NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "ChatsRequests" | "Blocked"
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
  const { theme } = useAppTheme();
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const { lastUpdateAt, initialLoadDoneOnce } = useChatStore(
    useSelect(["lastUpdateAt", "initialLoadDoneOnce"])
  );
  const userAddress = useCurrentAccount() as string;
  const refreshingRef = useRef(false);

  const renderItem = useCallback(
    ({ item }: { item: FlatListItemType }) => {
      if ("lastMessage" in item) {
        const conversation = unwrapConversationContainer(item);
        if (conversation.version === ConversationVersion.GROUP) {
          return (
            <AnimatedVStack
              entering={theme.animation.reanimatedFadeInSpring}
              exiting={theme.animation.reanimatedFadeOutSpring}
            >
              <V3GroupConversationListItem
                group={conversation as GroupWithCodecsType}
              />
            </AnimatedVStack>
          );
        } else {
          return (
            <AnimatedVStack
              entering={theme.animation.reanimatedFadeInSpring}
              exiting={theme.animation.reanimatedFadeOutSpring}
            >
              <V3DMListItem conversation={conversation as DmWithCodecsType} />
            </AnimatedVStack>
          );
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
    },
    [theme]
  );

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      console.log("refetching from pull");
      await refetch?.();
    } catch (error) {
      console.error(error);
    } finally {
      refreshingRef.current = false;
    }
  }, [refetch]);

  const onScrollList = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (refreshingRef.current) return;
      // On Android the list does not bounce, so this will only get hit
      // on iOS when the user scrolls up
      if (
        e.nativeEvent.contentOffset.y <
        CONVERSATION_FLASH_LIST_REFRESH_THRESHOLD
      ) {
        handleRefresh();
      }
    },
    [handleRefresh]
  );

  return (
    <View style={styles.container}>
      <View style={styles.conversationList}>
        <Animated.FlatList
          onRefresh={Platform.OS === "android" ? refetch : undefined}
          refreshing={Platform.OS === "android" ? isRefetching : undefined}
          keyboardShouldPersistTaps="handled"
          onMomentumScrollBegin={onScroll}
          onScrollBeginDrag={onScroll}
          onScroll={onScrollList}
          alwaysBounceVertical={items.length > 0}
          itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
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
          // estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
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
