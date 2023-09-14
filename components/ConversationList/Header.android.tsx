import React, { useEffect } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Searchbar as MaterialSearchBar } from "react-native-paper";

import { useChatStore } from "../../data/store/accountsStore";
import {
  chatInputBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import Picto from "../Picto/Picto";
import SettingsButton from "../SettingsButton";
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
}: ConversationListHeaderProps) => {};

type HeaderSearchBarProps = {
  navigation: any; // replace
  route: any; // replace
  shouldShowConnectingOrSyncing: boolean;
  flatListItems: any[];
  setSearchBarFocused: React.Dispatch<React.SetStateAction<boolean>>;
  showWelcome: boolean;
  searchBarRef: React.RefObject<any>;
};

export const useHeaderSearchBar = ({
  navigation,
  showWelcome,
  route,
  shouldShowConnectingOrSyncing,
  flatListItems,
  searchBarRef,
  setSearchBarFocused,
}: HeaderSearchBarProps) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const {
    initialLoadDoneOnce,
    conversations,
    lastUpdateAt,
    searchQuery,
    setSearchQuery,
  } = useChatStore((s) =>
    pick(s, [
      "initialLoadDoneOnce",
      "conversations",
      "lastUpdateAt",
      "searchQuery",
      "setSearchQuery",
    ])
  );

  useEffect(() => {
    const onChangeSearch = (query: string) => setSearchQuery(query);

    // Sets the `right` property to display profile button only when `searchQuery` is empty
    const rightProps = searchQuery
      ? {}
      : {
          right: () => (
            <View style={styles.rightButtonContainer}>
              <ShareProfileButton navigation={navigation} route={route} />
            </View>
          ),
        };

    navigation.setOptions({
      headerLeft: () =>
        !shouldShowConnectingOrSyncing ? (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBarWrapper}>
              <MaterialSearchBar
                onFocus={() => setSearchBarFocused(true)}
                onBlur={() => setSearchBarFocused(false)}
                style={styles.searchBar}
                placeholder="Search chats"
                onChangeText={onChangeSearch}
                value={searchQuery}
                icon={() => (
                  <SettingsButton route={route} navigation={navigation} />
                )}
                mode="bar"
                autoCapitalize="none"
                autoFocus={false}
                autoCorrect={false}
                traileringIcon={() => null}
                placeholderTextColor={textSecondaryColor(colorScheme)}
                selectionColor={textPrimaryColor(colorScheme)}
                clearIcon={({ color }) => (
                  <Picto picto="xmark" size={24} color={color} />
                )}
                {...rightProps}
              />
            </View>
            <View style={styles.searchBarSpacer}>{/* Right spacer */}</View>
          </View>
        ) : null,
    });
  }, [
    navigation,
    shouldShowConnectingOrSyncing,
    colorScheme,
    route,
    styles,
    setSearchBarFocused,
    searchQuery,
    setSearchQuery,
  ]);
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    rightButtonContainer: {
      flex: 0.16,
    },
    searchBarContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      width: "100%",
    },
    searchBarWrapper: {
      flex: 1,
    },
    searchBar: {
      backgroundColor: chatInputBackgroundColor(colorScheme),
      paddingLeft: 5,
      paddingRight: 8,
      marginVertical: 10,
    },
    searchBarSpacer: {
      width: 30,
    },
  });
};
