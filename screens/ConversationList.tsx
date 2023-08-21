import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, useColorScheme, Text, View } from "react-native";

import Connecting, {
  useShouldShowConnectingOrSyncing,
} from "../components/Connecting";
import NewConversationButton from "../components/ConversationList/NewConversationButton";
import ShareProfileButton from "../components/ConversationList/ShareProfileButton";
import ConversationListItem from "../components/ConversationListItem";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import Recommendations from "../components/Recommendations/Recommendations";
import SettingsButton from "../components/SettingsButton";
import Welcome from "../components/Welcome";
import {
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import {
  LastMessagePreview,
  conversationLastMessagePreview,
} from "../utils/conversation";
import { pick } from "../utils/objects";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Main";

type ConversationWithLastMessagePreview = XmtpConversation & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

export default function ConversationList({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { initialLoadDoneOnce, conversations, lastUpdateAt } = useChatStore(
    (s) => pick(s, ["initialLoadDoneOnce", "conversations", "lastUpdateAt"])
  );
  const userAddress = useUserStore((s) => s.userAddress);
  const { blockedPeers, ephemeralAccount } = useSettingsStore((s) =>
    pick(s, ["blockedPeers", "ephemeralAccount"])
  );
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);
  useEffect(() => {
    const conversationsList = Object.values(conversations)
      .filter((a) => a?.peerAddress && (!a.pending || a.messages.size > 0))
      .map((c: ConversationWithLastMessagePreview) => {
        c.lastMessagePreview = conversationLastMessagePreview(c, userAddress);
        return c;
      });
    conversationsList.sort((a, b) => {
      const aDate = a.lastMessagePreview
        ? a.lastMessagePreview.message.sent
        : a.createdAt;
      const bDate = b.lastMessagePreview
        ? b.lastMessagePreview.message.sent
        : b.createdAt;
      return bDate - aDate;
    });
    const items = ephemeralAccount ? [{ topic: "ephemeral" }] : [];
    setFlatListItems([...items, ...conversationsList, { topic: "welcome" }]);
  }, [ephemeralAccount, userAddress, conversations, lastUpdateAt]);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        userAddress ? (
          <SettingsButton route={route} navigation={navigation} />
        ) : null,
      headerRight: () => (
        <>
          <ShareProfileButton navigation={navigation} route={route} />
          {Platform.OS === "ios" && (
            <NewConversationButton navigation={navigation} route={route} />
          )}
        </>
      ),
    });
  }, [navigation, route, userAddress]);
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (shouldShowConnectingOrSyncing) {
          return <Connecting />;
        } else {
          return Platform.OS === "android" ? (
            <Text style={styles.androidTitle}>Converse</Text>
          ) : undefined;
        }
      },
    });
  }, [navigation, shouldShowConnectingOrSyncing, styles.androidTitle]);
  const keyExtractor = useCallback((item: FlatListItem) => {
    return item.topic;
  }, []);
  const renderItem = useCallback(
    ({ item }: { item: FlatListItem }) => {
      if (item.topic === "welcome") {
        return <Welcome ctaOnly navigation={navigation} route={route} />;
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

  let screenToShow: JSX.Element;

  if (!initialLoadDoneOnce && flatListItems.length <= 1) {
    screenToShow = <InitialLoad />;
  } else if (
    flatListItems.length === 1 ||
    (flatListItems.length === 2 && ephemeralAccount)
  ) {
    screenToShow = (
      <Welcome ctaOnly={false} navigation={navigation} route={route} />
    );
  } else {
    screenToShow = (
      <View style={styles.conversationList}>
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
          data={flatListItems}
          extraData={[
            colorScheme,
            navigation,
            route,
            userAddress,
            blockedPeers,
            initialLoadDoneOnce,
          ]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={Platform.OS === "ios" ? 77 : 88}
        />
      </View>
    );
  }

  return (
    <>
      {screenToShow}
      <Recommendations navigation={navigation} visibility="HIDDEN" />
      {Platform.OS === "android" && (
        <NewConversationButton navigation={navigation} route={route} />
      )}
    </>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    conversationList: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    androidTitle: {
      color: textPrimaryColor(colorScheme),
      fontSize: 22,
      lineHeight: 26,
    },
  });
};
