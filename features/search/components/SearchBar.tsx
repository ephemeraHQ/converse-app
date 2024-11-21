import React from "react";
import { Platform, TextInput, View, ViewStyle, TextStyle } from "react-native";
import {
  IconButton as MaterialIconButton,
  Searchbar as MaterialSearchBar,
} from "react-native-paper";
import { Icon } from "@design-system/Icon/Icon";
import { useAppTheme, ThemedStyle } from "@theme/useAppTheme";
import { textSizeStyles } from "@design-system/Text/Text.styles";

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
          onChangeText={(text) => setValue(text.trim())}
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
  paddingRight: spacing.base,
  marginRight: spacing.base,
  color: colors.text.primary,
  ...textSizeStyles.sm,
});

const $androidSearchBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: "transparent",
});
