import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Searchbar as MaterialSearchBar } from "react-native-paper";

import { useChatStore } from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Main";
import {
  chatInputBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import {
  useShouldShowConnectingOrSyncing,
  useShouldShowConnecting,
} from "../Connecting";
import Picto from "../Picto/Picto";
import SettingsButton from "../SettingsButton";
import ShareProfileButton from "./ShareProfileButton";

type HeaderSearchBarProps = {
  userAddress: string | null;
  showWelcome: boolean;
  flatListItems: any[];
  searchBarRef: React.RefObject<any>;
} & NativeStackScreenProps<NavigationParamList, "Chats">;

type TextInputHandles = Pick<
  TextInput,
  "setNativeProps" | "isFocused" | "clear" | "blur" | "focus"
>;

export const useHeaderSearchBar = ({
  navigation,
  route,
}: HeaderSearchBarProps) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const shouldShowConnecting = useShouldShowConnecting();
  const { searchQuery, setSearchQuery, searchBarFocused, setSearchBarFocused } =
    useChatStore((s) =>
      pick(s, [
        "searchQuery",
        "setSearchQuery",
        "searchBarFocused",
        "setSearchBarFocused",
      ])
    );
  const searchBar = useRef<TextInputHandles | null>(null);

  useEffect(() => {
    // Sets the `right` property to display profile button only when `searchQuery` is empty
    // Overrides default dehavior: show clear button when `searchQuery` is empty and searchBar is focused
    const rightNotFocused = {
      right: () => (
        <View style={styles.rightButtonContainer}>
          <ShareProfileButton navigation={navigation} route={route} />
        </View>
      ),
    };
    const rightFocusedEmptyQuery = {
      right: () => (
        <TouchableOpacity
          style={styles.rightButtonContainer}
          onPress={() => searchBar.current?.blur()}
        >
          <Picto
            picto="xmark"
            size={24}
            color={textSecondaryColor(colorScheme)}
          />
        </TouchableOpacity>
      ),
    };
    const rightProps = !searchBarFocused
      ? rightNotFocused
      : searchQuery === ""
      ? rightFocusedEmptyQuery
      : {};

    const onChangeSearch = (query: string) => setSearchQuery(query);
    const searchPlaceholder = (): string => {
      if (shouldShowConnectingOrSyncing && !searchBarFocused) {
        return shouldShowConnecting ? "Connecting…" : "Syncing…";
      }
      return "Search chats";
    };

    navigation.setOptions({
      headerLeft: () => (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <MaterialSearchBar
              ref={searchBar}
              onFocus={() => setSearchBarFocused(true)}
              onBlur={() => setSearchBarFocused(false)}
              style={styles.searchBar}
              placeholder={searchPlaceholder()}
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
              onClearIconPress={() => {
                searchBar.current?.blur();
              }}
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
    shouldShowConnecting,
    colorScheme,
    route,
    styles,
    searchBarFocused,
    setSearchBarFocused,
    searchQuery,
    setSearchQuery,
  ]);
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    rightButtonContainer: {
      width: 38,
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
