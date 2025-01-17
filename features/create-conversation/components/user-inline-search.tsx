/**
 * A searchable chip list component for selecting users
 * Supports keyboard navigation and chip management
 *
 * @param {object} props Component props
 * @param {string} props.value Current search input value
 * @param {(value: string) => void} props.onChangeText Called when input changes
 * @param {(ref: TextInput | null) => void} props.onRef Called with input ref
 * @param {string} props.placeholder Placeholder text for empty input
 * @param {Array<{address: string, name: string}>} props.selectedUsers Currently selected users
 * @param {(address: string) => void} props.onRemoveUser Called when removing a user
 */

import React, { useRef, useState } from "react";
import { Platform, TextInput, View, ViewStyle, TextStyle } from "react-native";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Text } from "@/design-system/Text";
import { Pressable } from "@/design-system/Pressable";
import { Icon } from "@/design-system/Icon/Icon";
import { textSizeStyles } from "@/design-system/Text/Text.styles";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onRef: (ref: TextInput | null) => void;
  placeholder?: string;
  selectedUsers: Array<{
    address: string;
    name: string;
  }>;
  onRemoveUser: (address: string) => void;
};

export function UserInlineSearch({
  value,
  onChangeText,
  onRef,
  placeholder = "Search users...",
  selectedUsers,
  onRemoveUser,
}: Props) {
  const { theme, themed } = useAppTheme();
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(
    null
  );
  const inputRef = useRef<TextInput | null>(null);

  const handleKeyPress = ({ nativeEvent: { key } }: any) => {
    if (key === "Backspace" && value === "") {
      if (selectedChipIndex !== null) {
        onRemoveUser(selectedUsers[selectedChipIndex].address);
        setSelectedChipIndex(null);
      } else if (selectedUsers.length > 0) {
        setSelectedChipIndex(selectedUsers.length - 1);
      }
    } else if (key === "ArrowLeft" && value === "") {
      if (selectedChipIndex === null && selectedUsers.length > 0) {
        setSelectedChipIndex(selectedUsers.length - 1);
      } else if (selectedChipIndex !== null && selectedChipIndex > 0) {
        setSelectedChipIndex(selectedChipIndex - 1);
      }
    } else if (key === "ArrowRight" && selectedChipIndex !== null) {
      if (selectedChipIndex < selectedUsers.length - 1) {
        setSelectedChipIndex(selectedChipIndex + 1);
      } else {
        setSelectedChipIndex(null);
        inputRef.current?.focus();
      }
    } else {
      setSelectedChipIndex(null);
    }
  };

  return (
    <View style={themed($container)}>
      <View style={themed($inputContainer)}>
        {selectedUsers.map((user, index) => (
          <Pressable
            key={user.address}
            onPress={() => {
              if (selectedChipIndex === index) {
                onRemoveUser(user.address);
                setSelectedChipIndex(null);
              } else {
                setSelectedChipIndex(index);
              }
            }}
            style={[
              themed($chip),
              selectedChipIndex === index && themed($selectedChip),
            ]}
          >
            <Text
              preset="formLabel"
              style={[
                themed($chipText) as TextStyle,
                selectedChipIndex === index &&
                  (themed($selectedChipText) as TextStyle),
              ]}
              numberOfLines={1}
            >
              {user.name}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRemoveUser(user.address);
              }}
              style={themed($removeButton)}
            >
              <Icon
                icon="xmark"
                size={theme.iconSize.sm}
                color={
                  selectedChipIndex === index
                    ? theme.colors.text.inverted.primary
                    : theme.colors.text.secondary
                }
              />
            </Pressable>
          </Pressable>
        ))}

        <TextInput
          ref={(r) => {
            inputRef.current = r;
            onRef(r);
          }}
          style={themed($input) as TextStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={selectedUsers.length === 0 ? placeholder : ""}
          placeholderTextColor={theme.colors.text.secondary}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
  borderBottomColor: colors.border.subtle,
});

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: spacing["3xl"],
  paddingHorizontal: spacing.sm,
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: spacing.xs,
});

const $input: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: 120,
  height: spacing["3xl"],
  color: colors.text.primary,
  ...textSizeStyles.sm,
});

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background.surface,
  borderRadius: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  gap: spacing.xxs,
});

const $selectedChip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.blurred,
});

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
  maxWidth: 150,
});

const $selectedChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.inverted.primary,
});

const $removeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xxs,
  marginLeft: -spacing.xxs,
});
