import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useLayoutEffect } from "react";
import {
  NativeSyntheticEvent,
  TextInputChangeEventData,
  useColorScheme,
} from "react-native";
import { SearchBarCommands } from "react-native-screens";

import Connecting, {
  useShouldShowConnectingOrSyncing,
} from "../../components/Connecting";
import NewConversationButton from "../../components/ConversationList/NewConversationButton";
import ProfileSettingsButton from "../../components/ConversationList/ProfileSettingsButton";
import { useAccountsStore, useChatStore } from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { headerTitleStyle } from "../../utils/colors";
import { isDesktop } from "../../utils/device";
import { getReadableProfile } from "../../utils/str";
import ConversationList from "../ConversationList";
import {
  NativeStack,
  NavigationParamList,
  navigationAnimation,
} from "./Navigation";

type HeaderSearchBarProps = {
  searchBarRef: React.RefObject<any>;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

// If we set the search bar in the NativeStack.Screen and navigate to it,
// it show before hiding so we do an exception and don't set it in the Screen
// but using useLayoutEffect. To avoid warning and search not always being set,
// useLayoutEffect must NOT be conditional so we can't hide it with conditions…

export const useHeaderSearchBar = ({
  navigation,
  searchBarRef,
}: HeaderSearchBarProps) => {
  const { setSearchQuery, setSearchBarFocused } = useChatStore(
    useSelect(["setSearchQuery", "setSearchBarFocused"])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        ref: searchBarRef as React.RefObject<SearchBarCommands>,
        hideNavigationBar: !isDesktop,
        // set to hideWhenScrolling to `false` to  to make the search bar always visible
        // set it to `true` to avoid a visual glitch while loading conversations during initial load
        hideWhenScrolling: !isDesktop,
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
  }, [navigation, searchBarRef, setSearchBarFocused, setSearchQuery]);
};

export default function ConversationListNav() {
  const colorScheme = useColorScheme();

  const searchBarRef = React.useRef<SearchBarCommands>(
    null
  ) as React.MutableRefObject<SearchBarCommands | null>;

  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const currentAccount = useAccountsStore((s) => s.currentAccount);

  return (
    <NativeStack.Screen
      name="Chats"
      options={({ route, navigation }) => ({
        headerTitle: () =>
          shouldShowConnectingOrSyncing ? <Connecting /> : undefined,
        headerLargeTitle: true,
        headerTitleStyle: headerTitleStyle(colorScheme),
        headerBackTitle: getReadableProfile(currentAccount, currentAccount),
        headerRight: () => (
          <>
            <ProfileSettingsButton />
            <NewConversationButton navigation={navigation} route={route} />
          </>
        ),
        animation: navigationAnimation,
      })}
    >
      {(navigationProps) => (
        <ConversationList {...navigationProps} searchBarRef={searchBarRef} />
      )}
    </NativeStack.Screen>
  );
}
