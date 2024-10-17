import { ErroredHeader } from "@components/ErroredHeader";
import { useShouldShowErrored } from "@hooks/useShouldShowErrored";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import React, { useLayoutEffect } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SearchBarCommands } from "react-native-screens";

import Connecting, {
  useShouldShowConnecting,
  useShouldShowConnectingOrSyncing,
} from "../../components/Connecting";
import NewConversationButton from "../../components/ConversationList/NewConversationButton";
import ProfileSettingsButton from "../../components/ConversationList/ProfileSettingsButton";
import { useAccountsStore, useChatStore } from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { HStack } from "../../design-system/HStack";
import { IconButton } from "../../design-system/IconButton";
import { VStack } from "../../design-system/VStack";
import { PictoSizes } from "../../styles/sizes";
import { isDesktop } from "../../utils/device";
import { navigate } from "../../utils/navigation";
import { getReadableProfile, shortDisplayName } from "../../utils/str";
import ConversationList from "../ConversationList";
import {
  NativeStack,
  NavigationParamList,
  navigationAnimation,
} from "./Navigation";

type HeaderSearchBarProps = {
  searchBarRef: React.RefObject<any>;
  autoHide: boolean;
  showSearchBar: boolean;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

// If we set the search bar in the NativeStack.Screen and navigate to it,
// it show before hiding so we do an exception and don't set it in the Screen
// but using useLayoutEffect. To avoid warning and search not always being set,
// useLayoutEffect must NOT be conditional so we can't hide it with conditions…

export const useHeaderSearchBar = ({
  navigation,
  searchBarRef,
  autoHide,
  showSearchBar = true,
}: HeaderSearchBarProps) => {
  const { setSearchQuery, setSearchBarFocused } = useChatStore(
    useSelect(["setSearchQuery", "setSearchBarFocused"])
  );

  useLayoutEffect(() => {
    if (!showSearchBar) {
      navigation.setOptions({
        headerSearchBarOptions: undefined,
      });
      return;
    }
    navigation.setOptions({
      headerSearchBarOptions: {
        ref: searchBarRef as React.RefObject<SearchBarCommands>,
        hideNavigationBar: autoHide && !isDesktop,
        hideWhenScrolling: autoHide && !isDesktop,
        autoFocus: false,
        placeholder: "Search",
        onChangeText: (
          event: NativeSyntheticEvent<TextInputChangeEventData>
        ) => {
          setSearchQuery(event.nativeEvent.text);
        },
        onFocus: () => setSearchBarFocused(true),
        onCancelButtonPress: () => setSearchBarFocused(false),
      },
    });
  }, [
    autoHide,
    navigation,
    searchBarRef,
    setSearchBarFocused,
    setSearchQuery,
    showSearchBar,
  ]);
};

export default function ConversationListNav() {
  const colorScheme = useColorScheme();

  const searchBarRef = React.useRef<SearchBarCommands>(
    null
  ) as React.MutableRefObject<SearchBarCommands | null>;

  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const shouldShowConnecting = useShouldShowConnecting();
  const shouldShowError = useShouldShowErrored();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const name = getReadableProfile(currentAccount, currentAccount);

  return (
    <NativeStack.Screen
      name="Chats"
      options={({ route, navigation }) => ({
        headerTitle: () =>
          shouldShowConnectingOrSyncing ? (
            <View style={styles.connectingContainer}>
              {shouldShowConnectingOrSyncing && <Connecting />}
              {shouldShowConnecting.warnMessage && (
                <Text
                  style={[
                    styles.warn,
                    { color: textSecondaryColor(colorScheme) },
                  ]}
                >
                  {shouldShowConnecting.warnMessage}
                </Text>
              )}
            </View>
          ) : (
            <View />
          ),
        headerBackTitle: getReadableProfile(currentAccount, currentAccount),
        headerRight: () => (
          <HStack style={styles.headerRightContainer}>
            <IconButton
              iconName="qrcode"
              size={PictoSizes.conversationNav}
              onPress={() => navigate("ShareProfile")}
              hitSlop={8}
            />
            <VStack style={styles.offsetComposeIcon}>
              <NewConversationButton navigation={navigation} route={route} />
            </VStack>
          </HStack>
        ),
        headerTintColor: textPrimaryColor(colorScheme),
        headerShadowVisible: false,
        animation: navigationAnimation,
        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
            <View>
              <ProfileSettingsButton />
            </View>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Profile", {
                  address: currentAccount,
                });
              }}
            >
              <View style={styles.headerLeftTouchable}>
                <Text
                  style={[
                    styles.headerLeftText,
                    {
                      color:
                        colorScheme === "dark"
                          ? "rgba(255, 255, 255, 0.6)"
                          : "rgba(0, 0, 0, 0.6)",
                    },
                  ]}
                >
                  {shouldShowConnecting.warnMessage
                    ? shortDisplayName(name)
                    : name}
                </Text>
                {shouldShowError && <ErroredHeader />}
              </View>
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      {(navigationProps) => (
        <ConversationList {...navigationProps} searchBarRef={searchBarRef} />
      )}
    </NativeStack.Screen>
  );
}

const styles = StyleSheet.create({
  connectingContainer: {
    marginTop: -5,
    flexDirection: "row",
    alignItems: "center",
  },
  warn: {
    marginLeft: 8,
  },
  headerRightContainer: {
    alignItems: "center",
    marginTop: -8,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: -10,
  },
  offsetComposeIcon: {
    top: -2,
  },
  headerLeftTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerLeftText: {
    fontSize: 16,
    paddingBottom: 6,
  },
});
