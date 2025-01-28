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
import { TextInput, View, ViewStyle, TextStyle } from "react-native";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { textSizeStyles } from "@/design-system/Text/Text.styles";
import { Text } from "@/design-system/Text";
import logger from "@/utils/logger";
import { Chip } from "@/design-system/chip";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onRef: (ref: TextInput | null) => void;
  placeholder?: string;
  selectedUsers: Array<{
    address: string;
    name: string;
    avatarUri: string | undefined;
  }>;
  onRemoveUser: (address: string) => void;
};

export function UserInlineSearch({
  value,
  onChangeText,
  onRef,
  placeholder = "Name, address or onchain ID",
  selectedUsers,
  onRemoveUser,
}: Props) {
  const { theme, themed } = useAppTheme();
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(
    null
  );
  const inputRef = useRef<TextInput | null>(null);

  const handleKeyPress = ({ nativeEvent: { key } }: any) => {
    logger.debug("key", key);
    if (key === "Backspace" && value === "") {
      if (selectedChipIndex !== null) {
        onRemoveUser(selectedUsers[selectedChipIndex].address);
        setSelectedChipIndex(null);
      } else if (selectedUsers.length > 0) {
        setSelectedChipIndex(selectedUsers.length - 1);
      }
    } else {
      setSelectedChipIndex(null);
    }
  };

  return (
    <View style={themed($container)}>
      <View style={themed($inputContainer)}>
        <Text preset="formLabel" style={themed($toText)}>
          To
        </Text>
        {selectedUsers.map((user, index) => (
          <Chip
            avatarUri={user.avatarUri}
            key={user.address}
            name={user.name}
            isSelected={selectedChipIndex === index}
            onPress={() => {
              if (selectedChipIndex === index) {
                setSelectedChipIndex(null);
              } else {
                setSelectedChipIndex(index);
              }
            }}
          />
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

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background.surfaceless,
  marginHorizontal: 16,
  marginVertical: 8,
  //   padding: spacing.sm,
  //   borderColor: colors.border.subtle,
  //   ...debugBorder("blue")
});

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: spacing.xxxs,
  //   ...debugBorder("yellow"),
});

const $input: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  flex: 1,
  minWidth: 120,
  height: spacing["3xl"],
  color: colors.text.primary,
  paddingStart: spacing.xxs,
  ...textSizeStyles.xs,
  //   ...debugBorder("purple"),
});

const $toText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text.primary,
  marginEnd: spacing.xxs,
});
