import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { textPrimaryColor } from "@styles/colors";
import React, { useLayoutEffect } from "react";
import {
  NativeSyntheticEvent,
  Text,
  TextInputChangeEventData,
  View,
  useColorScheme,
} from "react-native";
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { SearchBarCommands } from "react-native-screens";

import {
  NativeStack,
  NavigationParamList,
  navigationAnimation,
} from "./Navigation";
import Connecting, {
  useShouldShowConnectingOrSyncing,
} from "../../components/Connecting";
import NewConversationButton from "../../components/ConversationList/NewConversationButton";
import ProfileSettingsButton from "../../components/ConversationList/ProfileSettingsButton";
import { useAccountsStore, useChatStore } from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { isDesktop } from "../../utils/device";
import { getReadableProfile } from "../../utils/str";
import ConversationList from "../ConversationList";

type HeaderSearchBarProps = {
  searchBarRef: React.RefObject<any>;
  autoHide: boolean;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

// If we set the search bar in the NativeStack.Screen and navigate to it,
// it show before hiding so we do an exception and don't set it in the Screen
// but using useLayoutEffect. To avoid warning and search not always being set,
// useLayoutEffect must NOT be conditional so we can't hide it with conditions…

export const useHeaderSearchBar = ({
  navigation,
  searchBarRef,
  autoHide,
}: HeaderSearchBarProps) => {
  const { setSearchQuery, setSearchBarFocused } = useChatStore(
    useSelect(["setSearchQuery", "setSearchBarFocused"])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        ref: searchBarRef as React.RefObject<SearchBarCommands>,
        hideNavigationBar: autoHide && !isDesktop,
        // set to hideWhenScrolling to `false` to  to make the search bar always visible
        // set it to `true` to avoid a visual glitch while loading conversations during initial load
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
  }, [autoHide, navigation, searchBarRef, setSearchBarFocused, setSearchQuery]);
};

export default function ConversationListNav() {
  const colorScheme = useColorScheme();

  const searchBarRef = React.useRef<SearchBarCommands>(
    null
  ) as React.MutableRefObject<SearchBarCommands | null>;

  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const name = getReadableProfile(currentAccount, currentAccount);

  return (
    <NativeStack.Screen
      name="Chats"
      options={({ route, navigation }) => ({
        headerTitle: () =>
          shouldShowConnectingOrSyncing ? <Connecting /> : <View />,
        headerBackTitle: getReadableProfile(currentAccount, currentAccount),
        headerRight: () => (
          <>
            <NewConversationButton navigation={navigation} route={route} />
          </>
        ),
        headerTintColor: textPrimaryColor(colorScheme),
        headerShadowVisible: false,
        animation: navigationAnimation,
        headerLeft: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
            }}
          >
            <View>
              <ProfileSettingsButton />
            </View>
            <GestureHandlerRootView style={{ flexShrink: 1 }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("Profile", {
                    address: currentAccount,
                  });
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color:
                      colorScheme === "dark"
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.6)",
                    paddingBottom: 6,
                  }}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            </GestureHandlerRootView>
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
