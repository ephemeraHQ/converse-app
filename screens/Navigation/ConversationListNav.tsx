import React, { useRef } from "react";
import {
  useColorScheme,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Searchbar as MaterialSearchBar } from "react-native-paper";

import {
  useShouldShowConnecting,
  useShouldShowConnectingOrSyncing,
} from "../../components/Connecting";
import ProfileSettingsButton from "../../components/ConversationList/ProfileSettingsButton";
import Picto from "../../components/Picto/Picto";
import { useChatStore } from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import {
  chatInputBackgroundColor,
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { converseEventEmitter } from "../../utils/events";
import ConversationList from "../ConversationList";
import { NativeStack, navigationAnimation } from "./Navigation";
import { useIsSplitScreen } from "./navHelpers";

export const useHeaderSearchBar = (props: any) => {
  // No-op
};

export default function ConversationListNav() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const searchBar = useRef<TextInput | null>(null);
  const isSplitScreen = useIsSplitScreen();
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const shouldShowConnecting = useShouldShowConnecting();
  const { searchQuery, setSearchQuery, searchBarFocused, setSearchBarFocused } =
    useChatStore(
      useSelect([
        "searchQuery",
        "setSearchQuery",
        "searchBarFocused",
        "setSearchBarFocused",
      ])
    );

  const rightNotFocused = {
    right: () => (
      <View style={styles.rightButtonContainer}>
        <ProfileSettingsButton />
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
                inputStyle={styles.searchBarInputStyle}
                placeholder={searchPlaceholder()}
                onChangeText={onChangeSearch}
                value={searchQuery}
                icon={({ color }) => (
                  <Picto picto="menu" size={24} color={color} />
                )}
                onIconPress={() => {
                  if (Platform.OS === "android") {
                    converseEventEmitter.emit("toggle-navigation-drawer", true);
                  } else if (Platform.OS === "web") {
                    navigation.goBack();
                  }
                }}
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
  const isSplitScreen = useIsSplitScreen();
  return StyleSheet.create({
    rightButtonContainer: {
      width: 38,
    },
    searchBarContainer: Platform.select({
      default: {
        flexDirection: "row",
        justifyContent: "flex-start",
        width: "100%",
      },
      web: {
        flexDirection: "row",
        justifyContent: "flex-start",
        width: isSplitScreen ? 400 : "100%",
        marginLeft: 16,
      },
    }),
    searchBarWrapper: {
      flex: 1,
    },
    searchBar: {
      backgroundColor: chatInputBackgroundColor(colorScheme),
      paddingLeft: 5,
      paddingRight: 8,
      marginVertical: 10,
      height: 44,
    },
    searchBarInputStyle: {
      height: 44,
      minHeight: 0,
    },
    searchBarSpacer: {
      width: 30,
    },
  });
};
