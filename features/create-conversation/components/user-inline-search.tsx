import { Text } from "@/design-system/Text";
import { textSizeStyles } from "@/design-system/Text/Text.styles";
import { Chip } from "@/design-system/chip";
import {
  useConversationStore,
  useConversationStoreContext,
} from "@/features/conversation/conversation.store-context";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import React, { memo, useCallback, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputKeyPressEventData,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export function UserInlineSearch() {
  const { theme, themed } = useAppTheme();
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(
    null
  );
  const inputRef = useRef<TextInput | null>(null);

  const conversationStore = useConversationStore();

  const searchUserAddresses = useConversationStoreContext(
    (state) => state.searchUserAddresses
  );

  const defaultSearchTextValue = conversationStore.getState().searchTextValue;

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    const { key } = e.nativeEvent;
    const searchUsersQueryValue = conversationStore.getState().searchTextValue;
    if (key === "Backspace" && searchUsersQueryValue === "") {
      if (selectedChipIndex !== null) {
        conversationStore.setState({
          searchUserAddresses: conversationStore
            .getState()
            .searchUserAddresses.filter(
              (user, index) => index !== selectedChipIndex
            ),
        });
        setSelectedChipIndex(null);
      } else if (conversationStore.getState().searchUserAddresses.length > 0) {
        setSelectedChipIndex(
          conversationStore.getState().searchUserAddresses.length - 1
        );
      }
    } else {
      setSelectedChipIndex(null);
    }
  };

  const handleChangeText = useCallback(
    (text: string) => {
      conversationStore.setState({
        searchTextValue: text,
      });
    },
    [conversationStore]
  );

  return (
    <View style={themed($container)} {...debugBorder()}>
      <View style={themed($inputContainer)}>
        <Text preset="formLabel" style={themed($toText)}>
          To
        </Text>
        {searchUserAddresses.map((user, index) => (
          <UserChip key={user} address={user} />
        ))}

        <TextInput
          ref={inputRef}
          style={themed($input) as TextStyle}
          defaultValue={defaultSearchTextValue}
          onChangeText={handleChangeText}
          placeholder={
            searchUserAddresses.length === 0
              ? "Name, address or onchain ID"
              : ""
          }
          placeholderTextColor={theme.colors.text.secondary}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const UserChip = memo(function UserChip(props: { address: string }) {
  const { address } = props;

  const avatarUri = usePreferredAvatarUri(address);
  const name = usePreferredName(address);

  const conversationStore = useConversationStore();
  const searchSelectedUserAddreses = useConversationStoreContext(
    (state) => state.searchSelectedUserAddreses
  );

  const isSelected = searchSelectedUserAddreses.includes(address);

  const handlePress = useCallback(() => {
    const isSelected = conversationStore
      .getState()
      .searchSelectedUserAddreses.includes(address);
    if (isSelected) {
      conversationStore.setState({
        searchSelectedUserAddreses: conversationStore
          .getState()
          .searchSelectedUserAddreses.filter((user) => user !== address),
      });
    } else {
      conversationStore.setState({
        searchSelectedUserAddreses: [
          ...conversationStore.getState().searchSelectedUserAddreses,
          address,
        ],
      });
    }
  }, [address, conversationStore]);

  return (
    <Chip
      avatarUri={avatarUri}
      name={name}
      isSelected={isSelected}
      onPress={handlePress}
    />
  );
});

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background.surfaceless,
  marginHorizontal: spacing.sm,
  marginVertical: spacing.xxs,
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
