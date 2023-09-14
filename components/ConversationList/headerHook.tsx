import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect } from "react";
import { NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

import { useChatStore } from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Main";
import { pick } from "../../utils/objects";
import Connecting, { useShouldShowConnectingOrSyncing } from "../Connecting";
import SettingsButton from "../SettingsButton";
import NewConversationButton from "./NewConversationButton";
import ShareProfileButton from "./ShareProfileButton";

type HeaderSearchBarProps = {
  userAddress: string | null;
  showWelcome: boolean;
  flatListItems: any[];
  searchBarRef: React.RefObject<any>;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

export const useHeaderSearchBar = ({
  navigation,
  route,
  userAddress,
  showWelcome,
  flatListItems,
  searchBarRef,
}: HeaderSearchBarProps) => {
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const { initialLoadDoneOnce, setSearchQuery, setSearchBarFocused } =
    useChatStore((s) =>
      pick(s, ["initialLoadDoneOnce", "setSearchQuery", "setSearchBarFocused"])
    );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (shouldShowConnectingOrSyncing) {
          return <Connecting />;
        } else {
          return undefined;
        }
      },
    });
  }, [navigation, shouldShowConnectingOrSyncing]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        userAddress ? (
          <SettingsButton route={route} navigation={navigation} />
        ) : null,
      headerRight: () => (
        <>
          <ShareProfileButton navigation={navigation} route={route} />
          <NewConversationButton navigation={navigation} route={route} />
        </>
      ),
    });
  }, [navigation, route, userAddress]);

  useLayoutEffect(() => {
    if (initialLoadDoneOnce && !showWelcome && flatListItems.length > 1) {
      navigation.setOptions({
        headerSearchBarOptions: {
          ref: searchBarRef,
          hideNavigationBar: true,
          // set `hideWhenScrolling` to `false` to make the search bar always visible for now
          hideWhenScrolling: false,
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
    }
  }, [
    navigation,
    initialLoadDoneOnce,
    flatListItems,
    searchBarRef,
    setSearchQuery,
    setSearchBarFocused,
    showWelcome,
  ]);
};
