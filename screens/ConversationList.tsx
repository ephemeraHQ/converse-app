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
  shouldShowConnectingOrSyncing,
} from "../components/Connecting";
import ConversationListItem from "../components/ConversationListItem";
import DebugButton, { shouldShowDebug } from "../components/DebugButton";
import EphemeralAccountBanner from "../components/EphemeralAccountBanner";
import InitialLoad from "../components/InitialLoad";
import Picto from "../components/Picto/Picto";
import Recommendations from "../components/Recommendations";
import SettingsButton from "../components/SettingsButton";
import Welcome from "../components/Welcome";
import { AppContext } from "../data/store/context";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { isAttachmentMessage } from "../utils/attachment";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { lastValueInMap } from "../utils/map";
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

type FlatListItem = XmtpConversation | { topic: string };

export default function ConversationList({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state } = useContext(AppContext);
  const [flatListItems, setFlatListItems] = useState<FlatListItem[]>([]);
  useEffect(() => {
    const conversations = Object.values(state.xmtp.conversations).filter(
      (a) => a?.peerAddress
    );
    conversations.sort((a, b) => {
      const aDate =
        (a.messages?.size > 0
          ? lastValueInMap(a.messages)?.sent
          : a.createdAt) || a.createdAt;
      const bDate =
        (b.messages?.size > 0
          ? lastValueInMap(b.messages)?.sent
          : b.createdAt) || b.createdAt;
      return bDate - aDate;
    });
    const items = state.app.ephemeralAccount ? [{ topic: "ephemeral" }] : [];
    setFlatListItems([...items, ...conversations, { topic: "welcome" }]);
  }, [
    state.app.ephemeralAccount,
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
        if (shouldShowConnectingOrSyncing(state)) {
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

      const conversation = item as XmtpConversation;
      const lastMessage = lastValueInMap(conversation.messages);

      return (
        <ConversationListItem
          navigation={navigation}
          conversation={conversation}
          colorScheme={colorScheme}
          conversationTopic={conversation.topic}
          conversationTime={
            conversation.messages?.size > 0
              ? lastMessage?.sent
              : conversation.createdAt
          }
          conversationName={conversationName(conversation)}
          showUnread={
            !!(
              state.xmtp.initialLoadDoneOnce &&
              lastMessage &&
              conversation.readUntil < lastMessage.sent &&
              lastMessage.senderAddress === conversation.peerAddress
            )
          }
          lastMessagePreview={
            state.xmtp.blockedPeerAddresses[
              conversation.peerAddress.toLowerCase()
            ]
              ? "This user is blocked"
              : conversation.messages?.size > 0
              ? isAttachmentMessage(lastMessage?.contentType)
                ? "📎 Media"
                : lastMessage?.contentType?.startsWith("xmtp.org/reaction:")
                ? "Reaction"
                : lastMessage?.content
              : ""
          }
          lastMessageStatus={lastMessage?.status}
          lastMessageFromMe={
            !!lastMessage && lastMessage?.senderAddress === state.xmtp.address
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
    (flatListItems.length === 2 && state.app.ephemeralAccount)
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
