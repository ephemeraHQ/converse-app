import {
  backgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  IconButton as MaterialIconButton,
  Searchbar as MaterialSearchBar,
} from "react-native-paper";

import Picto from "../Picto/Picto";

type Props = {
  inputPlaceholder: string;
  value: string;
  setValue: (v: string) => void;
  onRef: (r: TextInput | null) => void;
};

export default function SearchBar({
  inputPlaceholder,
  value,
  setValue,
  onRef,
}: Props) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <View style={styles.inputContainer}>
      {Platform.OS === "ios" && (
        <TextInput
          style={styles.input}
          placeholder={inputPlaceholder}
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          value={value}
          ref={onRef}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          onChangeText={(text) => setValue(text.trim())}
          clearButtonMode="always"
        />
      )}
      {(Platform.OS === "android" || Platform.OS === "web") && (
        <MaterialSearchBar
          placeholder={inputPlaceholder}
          onChangeText={(query) => setValue(query.trim())}
          value={value}
          icon={({ color }) => (
            <Picto
              picto="search"
              size={PictoSizes.searchBar}
              color={color}
              style={{ top: 1 }}
            />
          )}
          mode="bar"
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          ref={onRef}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          selectionColor={textPrimaryColor(colorScheme)}
          style={{
            backgroundColor: backgroundColor(colorScheme),
          }}
          right={() => {
            if (!value) return null;
            return (
              <MaterialIconButton
                icon={({ color }) => (
                  <Picto
                    picto="xmark"
                    size={PictoSizes.searchBar}
                    color={color}
                  />
                )}
                onPress={() => {
                  setValue("");
                }}
              />
            );
          }}
          clearIcon={() => null}
        />
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    inputContainer: {
      borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
    },
    input: {
      height: 46,
      paddingLeft: 16,
      paddingRight: 8,
      marginRight: 8,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
  });
};
