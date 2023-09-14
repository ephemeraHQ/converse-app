import React, { useEffect, useLayoutEffect } from "react";
import { NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

import SettingsButton from "../SettingsButton";
import NewConversationButton from "./NewConversationButton";
import ShareProfileButton from "./ShareProfileButton";

type ConversationListHeaderProps = {
  navigation: any; // @todo
  route: any; // @todo
  userAddress: string | null;
};

export const useConversationListHeader = ({
  navigation,
  route,
  userAddress,
}: ConversationListHeaderProps) => {
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
};

type HeaderSearchBarProps = {
  navigation: any;
  showWelcome: boolean;
  initialLoadDoneOnce: boolean;
  flatListItems: any[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSearchBarFocused: React.Dispatch<React.SetStateAction<boolean>>;
  searchBarRef: React.RefObject<any>;
  route: any; // replace
};

export const useHeaderSearchBar = ({
  navigation,
  showWelcome,
  route,
  initialLoadDoneOnce,
  flatListItems,
  setSearchQuery,
  setSearchBarFocused,
  searchBarRef,
}: HeaderSearchBarProps) => {
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
    setSearchBarFocused,
    setSearchQuery,
    showWelcome,
  ]);
};
