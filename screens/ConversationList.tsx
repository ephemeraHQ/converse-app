import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList } from "@shopify/flash-list";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ColorSchemeName,
  Platform,
  PlatformColor,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Text,
  View,
} from "react-native";
import { FAB } from "react-native-paper";

import Connecting, {
  useShouldShowConnectingOrSyncing,
} from "../components/Connecting";
import ConversationListItem from "../components/ConversationListItem";
import DebugButton, { shouldShowDebug } from "../components/DebugButton";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import Picto from "../components/Picto/Picto";
import Recommendations from "../components/Recommendations";
import SettingsButton from "../components/SettingsButton";
import Welcome from "../components/Welcome";
import { AppContext } from "../data/deprecatedStore/context";
import { XmtpConversationWithUpdate } from "../data/deprecatedStore/xmtpReducer";
import { useSettingsStore } from "../data/store/accountsStore";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import {
  LastMessagePreview,
  conversationLastMessagePreview,
} from "../utils/conversation";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Main";

function NewConversationButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  const debugRef = useRef();
  const { state } = useContext(AppContext);
  const showDebug = shouldShowDebug(state);
  const onPress = useCallback(() => {
    navigation.navigate("NewConversation", {});
  }, [navigation]);
  const onLongPress = useCallback(() => {
    if (!showDebug || !debugRef.current) {
      return;
    }
    (debugRef.current as any).showDebugMenu();
  }, [showDebug]);
  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity
        activeOpacity={0.2}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {showDebug && <DebugButton ref={debugRef} />}
        <Picto
          picto="square.and.pencil"
          weight="medium"
          color={PlatformColor("systemBlue")}
          size={16}
          style={{ width: 32, height: 32 }}
        />
      </TouchableOpacity>
    );
  } else {
    return (
      <FAB
        key={`FAB-newConversation-${colorScheme}`}
        icon={(props) => (
          <>
            {showDebug && <DebugButton ref={debugRef} />}
            <Picto
              picto="square.and.pencil"
              weight="medium"
              color={props.color}
              size={24}
            />
          </>
        )}
        animated={false}
        style={{
          position: "absolute",
          margin: 0,
          right: 16,
          bottom: 20,
        }}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  }
}

function ShareProfileButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("ShareProfile");
      }}
    >
      <Picto
        picto="qrcode"
        weight="medium"
        color={
          Platform.OS === "ios"
            ? PlatformColor("systemBlue")
            : textSecondaryColor(colorScheme)
        }
        size={Platform.OS === "ios" ? 16 : 24}
        style={{
          width: Platform.OS === "android" ? undefined : 32,
          height: Platform.OS === "android" ? undefined : 32,
          marginRight: Platform.OS === "android" ? 0 : 20,
        }}
      />
    </TouchableOpacity>
  );
}

type ConversationWithLastMessagePreview = XmtpConversationWithUpdate & {
  lastMessagePreview?: LastMessagePreview;
};
type FlatListItem = ConversationWithLastMessagePreview | { topic: string };

export default function ConversationList({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state } = useContext(AppContext);
  const ephemeralAccount = useSettingsStore((s) => s.ephemeralAccount);
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);
  useEffect(() => {
    const conversations = Object.values(state.xmtp.conversations)
      .filter((a) => a?.peerAddress && (!a.pending || a.messages.size > 0))
      .map((c: ConversationWithLastMessagePreview) => {
        c.lastMessagePreview = conversationLastMessagePreview(
          c,
          state.xmtp.address
        );
        return c;
      });
    conversations.sort((a, b) => {
      const aDate = a.lastMessagePreview
        ? a.lastMessagePreview.message.sent
        : a.createdAt;
      const bDate = b.lastMessagePreview
        ? b.lastMessagePreview.message.sent
        : b.createdAt;
      return bDate - aDate;
    });
    const items = ephemeralAccount ? [{ topic: "ephemeral" }] : [];
    setFlatListItems([...items, ...conversations, { topic: "welcome" }]);
  }, [
    ephemeralAccount,
    state.xmtp.address,
    state.xmtp.conversations,
    state.xmtp.lastUpdateAt,
  ]);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        state.xmtp.address ? (
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
  }, [navigation, route, state.xmtp.address]);
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
  }, [navigation, state, styles.androidTitle]);
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
              state.xmtp.initialLoadDoneOnce &&
              lastMessagePreview &&
              conversation.readUntil < lastMessagePreview.message.sent &&
              lastMessagePreview.message.senderAddress ===
                conversation.peerAddress
            )
          }
          lastMessagePreview={
            state.xmtp.blockedPeerAddresses[
              conversation.peerAddress.toLowerCase()
            ]
              ? "This user is blocked"
              : lastMessagePreview
              ? lastMessagePreview.contentPreview
              : ""
          }
          lastMessageStatus={lastMessagePreview?.message?.status}
          lastMessageFromMe={
            !!lastMessagePreview &&
            lastMessagePreview.message?.senderAddress === state.xmtp.address
          }
        />
      );
    },
    [
      colorScheme,
      navigation,
      route,
      state.xmtp.address,
      state.xmtp.blockedPeerAddresses,
      state.xmtp.initialLoadDoneOnce,
    ]
  );

  let screenToShow: JSX.Element;

  if (!state.xmtp.initialLoadDoneOnce && flatListItems.length <= 1) {
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
            state.xmtp.address,
            state.xmtp.blockedPeerAddresses,
            state.xmtp.initialLoadDoneOnce,
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

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
