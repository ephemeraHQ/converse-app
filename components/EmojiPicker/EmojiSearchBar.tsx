import Picto from "@components/Picto/Picto";
import { translate } from "@i18n";
import {
  textSecondaryColor,
  textPrimaryColor,
  backgroundColor,
  clickedItemBackgroundColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import React, { useCallback } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { Searchbar, IconButton } from "react-native-paper";

export const EmojiSearchBar = ({
  value,
  setValue,
}: {
  value: string;
  setValue: (value: string) => void;
}) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  const MaterialPicto = useCallback(
    ({ color }: { color: string }) => {
      return (
        <Picto
          picto="search"
          size={PictoSizes.searchBar}
          color={color}
          style={styles.searchIcon}
        />
      );
    },
    [styles.searchIcon]
  );

  const Right = useCallback(() => {
    if (!value) return null;
    return (
      <IconButton
        icon={({ color }) => (
          <Picto picto="xmark" size={PictoSizes.searchBar} color={color} />
        )}
        onPress={() => {
          setValue("");
        }}
      />
    );
  }, [setValue, value]);

  return (
    <View style={styles.inputContainer}>
      {Platform.OS === "ios" && (
        <View style={styles.iosContainer}>
          <Picto
            picto="magnifyingglass"
            size={PictoSizes.button}
            color={textSecondaryColor(colorScheme)}
            style={styles.iosPicto}
          />
          <TextInput
            style={styles.input}
            placeholder={translate("search_emojis")}
            autoCapitalize="none"
            autoFocus={false}
            autoCorrect={false}
            defaultValue={value}
            placeholderTextColor={textSecondaryColor(colorScheme)}
            onChangeText={setValue}
            clearButtonMode="always"
          />
        </View>
      )}
      {(Platform.OS === "android" || Platform.OS === "web") && (
        <Searchbar
          placeholder={translate("search_emojis")}
          onChangeText={setValue}
          value={value}
          icon={MaterialPicto}
          mode="bar"
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          selectionColor={textPrimaryColor(colorScheme)}
          style={styles.searchbar}
          right={Right}
          clearIcon={() => null}
        />
      )}
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    inputContainer: {
      marginVertical: 8,
      borderBottomWidth: Platform.OS === "android" ? 1 : 0,
      backgroundColor:
        Platform.OS === "ios"
          ? clickedItemBackgroundColor(colorScheme)
          : backgroundColor(colorScheme),
      borderRadius: 8,
      paddingLeft: 8,
    },
    input: {
      height: 32,
      paddingLeft: 16,
      paddingRight: 8,
      marginRight: 8,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
      flex: 1,
    },
    iosContainer: {
      flexDirection: "row",
      flex: 1,
    },
    iosPicto: {
      top: 1,
      marginLeft: 8,
    },
    searchIcon: {
      top: 1,
    },
    searchbar: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
};
