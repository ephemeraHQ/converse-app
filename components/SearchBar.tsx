import { Icon } from "@design-system/Icon/Icon";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import React from "react";
import { Platform, TextInput, TextStyle, View, ViewStyle } from "react-native";
import {
  IconButton as MaterialIconButton,
  Searchbar as MaterialSearchBar,
} from "react-native-paper";

type Props = {
  inputPlaceholder: string;
  value: string;
  setValue: (v: string) => void;
  onRef: (r: TextInput | null) => void;
};

export function SearchBar({ inputPlaceholder, value, setValue, onRef }: Props) {
  const { theme, themed } = useAppTheme();

  return (
    <View style={themed($inputContainer)}>
      {Platform.OS === "ios" ? (
        <TextInput
          style={themed($input)}
          placeholder={inputPlaceholder}
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          value={value}
          ref={onRef}
          placeholderTextColor={theme.colors.text.secondary}
          onChangeText={setValue}
          clearButtonMode="always"
        />
      ) : (
        <MaterialSearchBar
          placeholder={inputPlaceholder}
          onChangeText={(query) => setValue(query.trim())}
          value={value}
          icon={({ color }) => (
            <Icon
              icon="search"
              size={theme.iconSize.md}
              color={color}
              style={{ top: 1 }}
            />
          )}
          mode="bar"
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          ref={onRef}
          placeholderTextColor={theme.colors.text.secondary}
          selectionColor={theme.colors.text.primary}
          style={themed($androidSearchBar)}
          right={() => {
            if (!value) return null;
            return (
              <MaterialIconButton
                icon={({ color }) => (
                  <Icon icon="xmark" size={theme.iconSize.md} color={color} />
                )}
                onPress={() => setValue("")}
              />
            );
          }}
          clearIcon={() => null}
        />
      )}
    </View>
  );
}

const $inputContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
  borderBottomColor: colors.border.subtle,
});

const $input: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  height: spacing["3xl"],
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
  marginRight: spacing.sm,
  color: colors.text.primary,
  ...textSizeStyles.sm,
});

const $androidSearchBar = {
  backgroundColor: "transparent",
};
