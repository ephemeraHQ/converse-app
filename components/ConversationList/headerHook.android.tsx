import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Searchbar as MaterialSearchBar } from "react-native-paper";

import { useChatStore } from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Main";
import {
  chatInputBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import { useShouldShowConnectingOrSyncing } from "../Connecting";
import Picto from "../Picto/Picto";
import SettingsButton from "../SettingsButton";
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
}: HeaderSearchBarProps) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const { searchQuery, setSearchQuery, setSearchBarFocused } = useChatStore(
    (s) => pick(s, ["searchQuery", "setSearchQuery", "setSearchBarFocused"])
  );

  useEffect(() => {
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
    const onChangeSearch = (query: string) => setSearchQuery(query);
    navigation.setOptions({
      headerLeft: () => (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <MaterialSearchBar
              onFocus={() => setSearchBarFocused(true)}
              onBlur={() => setSearchBarFocused(false)}
              style={styles.searchBar}
              placeholder={
                shouldShowConnectingOrSyncing ? "Connecting…" : "Search chats"
              }
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
      ),
      headerTitle: () => {
        return null;
      },
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
      flex: 0.17,
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
