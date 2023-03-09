import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  ColorSchemeName,
  FlatList,
  PlatformColor,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import DebugButton from "../components/DebugButton";
import SettingsButton from "../components/SettingsButton";
import config from "../config";
import { AppContext } from "../data/store/context";
import { XmtpConversation } from "../data/store/xmtpReducer";
import {
  actionSecondaryColor,
  backgroundColor,
  clickedItemBackgroundColor,
  listItemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { lastValueInMap } from "../utils/map";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Main";

type ConversationListItemProps = {
  navigation: NativeStackNavigationProp<NavigationParamList, "Messages">;
  conversation: XmtpConversation;
  colorScheme: ColorSchemeName;
  conversationTime: number | undefined;
  conversationTopic: string;
  conversationName: string;
  lastMessagePreview: string | undefined;
};

const ConversationListItem = memo(function ConversationListItem({
  navigation,
  colorScheme,
  conversationTopic,
  conversationTime,
  conversationName,
  lastMessagePreview,
}: ConversationListItemProps) {
  const styles = getStyles(colorScheme);
  let timeToShow = "";
  if (conversationTime) {
    const days = differenceInCalendarDays(new Date(), conversationTime);
    if (days === 0) {
      timeToShow = format(conversationTime, "hh:mm aa");
    } else if (days === 1) {
      timeToShow = "yesterday";
    } else if (days < 7) {
      timeToShow = format(conversationTime, "EEEE");
    } else {
      timeToShow = format(conversationTime, "yyyy-MM-dd");
    }
  }
  const [selected, setSelected] = useState(false);
  const resetSelected = useCallback(() => {
    setSelected(false);
  }, []);
  useEffect(() => {
    navigation.addListener("transitionEnd", resetSelected);
    return () => {
      navigation.removeListener("transitionEnd", resetSelected);
    };
  }, [navigation, resetSelected]);
  return (
    <TouchableOpacity
      activeOpacity={1}
      key={conversationTopic}
      onPressIn={() => {}}
      onPress={() => {
        navigation.navigate("Conversation", {
          topic: conversationTopic,
        });
        setSelected(true);
      }}
      style={{
        backgroundColor: selected
          ? clickedItemBackgroundColor(colorScheme)
          : backgroundColor(colorScheme),
      }}
    >
      <View style={styles.conversationListItem}>
        <Text style={styles.peerAddress} numberOfLines={1}>
          {conversationName}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {lastMessagePreview}
        </Text>
        <View style={styles.timeAndChevron}>
          <Text style={styles.timeText}>{timeToShow}</Text>
          <SFSymbol
            name="chevron.right"
            weight="semibold"
            scale="large"
            color={actionSecondaryColor(colorScheme)}
            size={10}
            resizeMode="center"
            multicolor={false}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

function NewConversationButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const debugRef = useRef();
  const { state } = useContext(AppContext);
  const shouldShowDebug =
    config.debugMenu ||
    config.debugAddresses.includes(state.xmtp.address || "");
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("NewConversation", {});
      }}
      onLongPress={() => {
        if (!shouldShowDebug || !debugRef.current) {
          return;
        }
        (debugRef.current as any).showDebugMenu();
      }}
    >
      {shouldShowDebug && <DebugButton ref={debugRef} />}
      <SFSymbol
        name="square.and.pencil"
        weight="medium"
        scale="large"
        color={PlatformColor("systemBlue")}
        size={16}
        resizeMode="center"
        multicolor={false}
        style={{ width: 32, height: 32 }}
      />
    </TouchableOpacity>
  );
}

function ShareProfileButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={() => {
        navigation.navigate("ShareProfile");
      }}
    >
      <SFSymbol
        name="qrcode"
        weight="medium"
        scale="large"
        color={PlatformColor("systemBlue")}
        size={16}
        resizeMode="center"
        multicolor={false}
        style={{ width: 32, height: 32, marginRight: 20 }}
      />
    </TouchableOpacity>
  );
}

export default function ConversationList({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state } = useContext(AppContext);
  const [orderedConversations, setOrderedConversations] = useState<
    XmtpConversation[]
  >([]);
  useEffect(() => {
    const conversations = Object.values(state.xmtp.conversations).filter(
      (a) => a?.peerAddress
    );
    conversations.sort((a, b) => {
      const aDate =
        a.lazyMessages.length > 0
          ? a.lazyMessages[0].sent
          : (a.messages?.size > 0
              ? lastValueInMap(a.messages)?.sent
              : a.createdAt) || a.createdAt;
      const bDate =
        b.lazyMessages.length > 0
          ? b.lazyMessages[0].sent
          : (b.messages?.size > 0
              ? lastValueInMap(b.messages)?.sent
              : b.createdAt) || b.createdAt;
      return bDate - aDate;
    });
    setOrderedConversations(conversations);
  }, [state.xmtp.conversations, state.xmtp.lastUpdateAt]);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (state.xmtp.address ? <SettingsButton /> : null),
      headerRight: () => (
        <>
          <ShareProfileButton navigation={navigation} route={route} />
          <NewConversationButton navigation={navigation} route={route} />
        </>
      ),
    });
  }, [navigation, route, state.xmtp.address]);
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (!state.xmtp.initialLoadDone || state.xmtp.loading) {
          return <ActivityIndicator />;
        } else {
          return undefined;
        }
      },
    });
  }, [navigation, state.xmtp.initialLoadDone, state.xmtp.loading]);
  const keyExtractor = useCallback((item: XmtpConversation) => {
    return item.topic;
  }, []);
  const renderItem = useCallback(
    ({ item }: { item: XmtpConversation }) => (
      <ConversationListItem
        navigation={navigation}
        conversation={item}
        colorScheme={colorScheme}
        conversationTopic={item.topic}
        conversationTime={
          item.messages?.size > 0
            ? lastValueInMap(item.messages)?.sent
            : item.createdAt
        }
        conversationName={conversationName(item)}
        lastMessagePreview={
          item.lazyMessages.length > 0
            ? item.lazyMessages[0].content
            : item.messages?.size > 0
            ? lastValueInMap(item.messages)?.content
            : ""
        }
      />
    ),
    [colorScheme, navigation]
  );
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={styles.conversationList}
      data={orderedConversations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      initialNumToRender={20}
    />
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    conversationList: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    conversationListItem: {
      height: 77,
      borderBottomWidth: 0.25,
      borderBottomColor: listItemSeparatorColor(colorScheme),
      paddingTop: 8,
      paddingRight: 17,
      marginLeft: 32,
    },
    peerAddress: {
      fontSize: 17,
      fontWeight: "600",
      marginBottom: 3,
      color: textPrimaryColor(colorScheme),
      marginRight: 110,
    },
    messagePreview: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      flex: 1,
      marginBottom: 8,
    },
    timeAndChevron: {
      position: "absolute",
      top: 8,
      right: 17,
      flexDirection: "row",
      alignItems: "center",
    },
    timeText: {
      marginRight: 14,
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
    },
  });
