import { Text } from "@/design-system/Text";
import { textSizeStyles } from "@/design-system/Text/Text.styles";
import { Chip } from "@/design-system/chip";
import {
  useConversationStore,
  useConversationStoreContext,
} from "@/features/conversation/conversation.store-context";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputKeyPressEventData,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export function ConversationNewSearch() {
  const { theme, themed } = useAppTheme();
  const [selectedChipIndex, setSelectedChipIndex] = useState<number | null>(
    null
  );
  const inputRef = useRef<TextInput | null>(null);

  const conversationStore = useConversationStore();

  const searchSelectedUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds
  );

  const defaultSearchTextValue = conversationStore.getState().searchTextValue;

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    const { key } = e.nativeEvent;
    const { searchTextValue, searchSelectedUserInboxIds } =
      conversationStore.getState();

    if (key === "Backspace" && !searchTextValue) {
      if (selectedChipIndex !== null) {
        // Remove selected chip
        conversationStore.setState({
          searchSelectedUserInboxIds: searchSelectedUserInboxIds.filter(
            (_, index) => index !== selectedChipIndex
          ),
        });
        setSelectedChipIndex(null);
      } else if (searchSelectedUserInboxIds.length > 0) {
        // Select last chip for deletion
        setSelectedChipIndex(searchSelectedUserInboxIds.length - 1);
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

  useEffect(() => {
    conversationStore.subscribe(
      (state) => state.searchTextValue,
      (searchTextValue) => {
        if (searchTextValue === "") {
          inputRef.current?.clear();
        }
      }
    );
  }, [conversationStore]);

  return (
    <View style={themed($container)} {...debugBorder()}>
      <View style={themed($inputContainer)}>
        <Text preset="formLabel" style={themed($toText)}>
          To
        </Text>
        {searchSelectedUserInboxIds.map((inboxId) => (
          <UserChip key={inboxId} inboxId={inboxId} />
        ))}

        <TextInput
          ref={inputRef}
          style={themed($input) as TextStyle}
          defaultValue={defaultSearchTextValue}
          onChangeText={handleChangeText}
          placeholder={
            searchSelectedUserInboxIds.length === 0
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

const UserChip = memo(function UserChip(props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { data: avatarUri } = usePreferredInboxAvatar({ inboxId });
  const { data: name } = usePreferredInboxName({ inboxId });

  const conversationStore = useConversationStore();
  const searchSelectedUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds
  );

  const isSelected = searchSelectedUserInboxIds.includes(inboxId);

  const handlePress = useCallback(() => {
    const isSelected = conversationStore
      .getState()
      .searchSelectedUserInboxIds.includes(inboxId);
    if (isSelected) {
      conversationStore.setState({
        searchSelectedUserInboxIds: conversationStore
          .getState()
          .searchSelectedUserInboxIds.filter((user) => user !== inboxId),
      });
    } else {
      conversationStore.setState({
        searchSelectedUserInboxIds: [
          ...conversationStore.getState().searchSelectedUserInboxIds,
          inboxId,
        ],
      });
    }
  }, [inboxId, conversationStore]);

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
