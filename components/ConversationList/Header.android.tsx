import React, { useEffect, useRef } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Searchbar as MaterialSearchBar } from "react-native-paper";

import {
  chatInputBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
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
  searchQuery: string;
  flatListItems: any[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSearchBarFocused: React.Dispatch<React.SetStateAction<boolean>>;
  showWelcome: boolean;
  searchBarRef: React.RefObject<any>;
};

export const useHeaderSearchBar = ({
  navigation,
  route,
  shouldShowConnectingOrSyncing,
  searchQuery,
  setSearchQuery,
  setSearchBarFocused,
  showWelcome,
  flatListItems,
  searchBarRef,
}: HeaderSearchBarProps) => {
  // Debug

  // == Store the previous values of the dependencies
  const prevDeps = useRef({
    navigation,
    route,
    shouldShowConnectingOrSyncing,
    searchQuery,
  });
  // == End of debug

  const colorScheme = useColorScheme();
  const styles = useStyles();

  useEffect(() => {
    // == Debug
    // Check which dependency has changed
    const changedDeps = [];

    if (prevDeps.current.navigation !== navigation) {
      changedDeps.push("navigation");
    }

    if (prevDeps.current.route !== route) {
      changedDeps.push("route");
    }

    if (
      prevDeps.current.shouldShowConnectingOrSyncing !==
      shouldShowConnectingOrSyncing
    ) {
      changedDeps.push("shouldShowConnectingOrSyncing");
    }

    if (prevDeps.current.searchQuery !== searchQuery) {
      changedDeps.push("searchQuery");
    }

    // Log the changed dependencies
    if (changedDeps.length > 0) {
      console.log(
        "== useEffect re-run due to changed dependencies:",
        changedDeps.join(", ")
      );
    }
    // == END OF DEBUG

    const onChangeSearch = (query: React.SetStateAction<string>) =>
      setSearchQuery(query);

    // Sets the `right` property to display profile button only when `searchQuery` is empty
    const rightProps = {
      right: searchQuery
        ? undefined
        : () => (
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
    searchQuery,
    colorScheme,
    route,
    styles,
    setSearchBarFocused,
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
