import React, { useRef } from "react";
import {
  useColorScheme,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Searchbar as MaterialSearchBar } from "react-native-paper";

import {
  useShouldShowConnecting,
  useShouldShowConnectingOrSyncing,
} from "../../components/Connecting";
import ShareProfileButton from "../../components/ConversationList/ShareProfileButton";
import Picto from "../../components/Picto/Picto";
import SettingsButton from "../../components/SettingsButton";
import { useChatStore } from "../../data/store/accountsStore";
import {
  chatInputBackgroundColor,
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import ConversationList from "../ConversationList";
import { NativeStack, navigationAnimation } from "./Navigation";

export const useHeaderSearchBar = (props: any) => {
  // No-op
};

export default function ConversationListNav() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const searchBar = useRef<TextInput | null>(null);
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

  const rightNotFocused = {
    right: () => (
      <View style={styles.rightButtonContainer}>
        <ShareProfileButton />
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

  return (
    <NativeStack.Screen
      name="Chats"
      options={({ route, navigation }) => ({
        headerTitle: () => null,
        headerTitleStyle: {
          ...headerTitleStyle(colorScheme),
          fontSize: 22,
          lineHeight: 26,
        },
        animation: navigationAnimation,
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
      })}
    >
      {(navigationProps) => (
        <ConversationList {...navigationProps} searchBarRef={searchBar} />
      )}
    </NativeStack.Screen>
  );
}

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
