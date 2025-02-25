import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  NativeSyntheticEvent,
  TextInput as RNTextInput,
  StyleProp,
  TextInputKeyPressEventData,
  ViewStyle,
} from "react-native";
import { Center } from "@/design-system/Center";
import { useChipStyles } from "@/design-system/chip";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { TextInput } from "@/design-system/text-input";
import { VStack } from "@/design-system/VStack";
import {
  useConversationStore,
  useConversationStoreContext,
} from "@/features/conversation/conversation.store-context";
import { useAppTheme } from "@/theme/use-app-theme";
import { Haptics } from "@/utils/haptics";
import { ConversationCreateSearchInputChip } from "./conversation-create-search-input-chip";
import { useConversationCreateSearchInputStore } from "./conversation-create-search-input.store";

export const ConversationCreateSearchInput = memo(
  function ConversationCreateSearchInput() {
    const { theme } = useAppTheme();
    const styles = useConversationCreateSearchStyles();
    const inputRef = useRef<RNTextInput | null>(null);

    const conversationStore = useConversationStore();

    const searchSelectedUserInboxIds = useConversationStoreContext(
      (state) => state.searchSelectedUserInboxIds,
    );
    const selectedChipInboxId = useConversationCreateSearchInputStore(
      (state) => state.selectedChipInboxId,
    );

    const defaultSearchTextValue = conversationStore.getState().searchTextValue;

    const handleKeyPress = (
      e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    ) => {
      const { key } = e.nativeEvent;
      const { searchTextValue, searchSelectedUserInboxIds } =
        conversationStore.getState();
      const selectedInboxIdChip =
        useConversationCreateSearchInputStore.getState().selectedChipInboxId;

      if (key === "Backspace" && !searchTextValue) {
        Haptics.softImpactAsync();

        if (selectedInboxIdChip !== null) {
          // Remove selected chip
          conversationStore.setState({
            searchSelectedUserInboxIds: searchSelectedUserInboxIds.filter(
              (inboxId) => inboxId !== selectedInboxIdChip,
            ),
          });
          useConversationCreateSearchInputStore
            .getState()
            .actions.setSelectedChipInboxId(null);
        } else if (searchSelectedUserInboxIds.length > 0) {
          // Select last chip for deletion
          useConversationCreateSearchInputStore
            .getState()
            .actions.setSelectedChipInboxId(
              searchSelectedUserInboxIds[searchSelectedUserInboxIds.length - 1],
            );
        }
      } else {
        useConversationCreateSearchInputStore
          .getState()
          .actions.setSelectedChipInboxId(null);
      }
    };

    const handleChangeText = useCallback(
      (text: string) => {
        conversationStore.setState({
          searchTextValue: text,
        });
      },
      [conversationStore],
    );

    const handlePressOnTextInput = useCallback(() => {
      useConversationCreateSearchInputStore
        .getState()
        .actions.setSelectedChipInboxId(null);
    }, []);

    useEffect(() => {
      conversationStore.subscribe(
        (state) => state.searchTextValue,
        (searchTextValue) => {
          if (searchTextValue === "") {
            inputRef.current?.clear();
          }
        },
      );
    }, [conversationStore]);

    return (
      <VStack style={styles.$container}>
        <HStack style={styles.$inputContainer}>
          <Center style={styles.$toLabel}>
            <Text color="secondary">To</Text>
          </Center>
          <HStack style={styles.$chipContainer}>
            {searchSelectedUserInboxIds.map((inboxId) => (
              <ConversationCreateSearchInputChip
                key={inboxId}
                inboxId={inboxId}
              />
            ))}
            <TextInput
              onPress={handlePressOnTextInput}
              autoFocus
              ref={inputRef}
              style={styles.$input}
              defaultValue={defaultSearchTextValue}
              onChangeText={handleChangeText}
              placeholder={
                searchSelectedUserInboxIds.length === 0
                  ? "Name, @username or onchain ID"
                  : ""
              }
              onKeyPress={handleKeyPress}
              autoCapitalize="none"
              autoCorrect={false}
              caretHidden={Boolean(selectedChipInboxId)}
            />
          </HStack>
        </HStack>
      </VStack>
    );
  },
);

function useConversationCreateSearchStyles() {
  const { theme } = useAppTheme();

  const chipStyles = useChipStyles({ variant: "outlined" });

  const $container = {
    backgroundColor: theme.colors.background.surfaceless,
    padding: theme.spacing.sm,
  } satisfies StyleProp<ViewStyle>;

  const $inputContainer = {
    columnGap: theme.spacing.xxs,
    alignItems: "center",
    minHeight:
      chipStyles.$content.height + chipStyles.$container.paddingVertical * 2,
  } satisfies StyleProp<ViewStyle>;

  const $toLabel = {
    alignSelf: "flex-start",
    height:
      chipStyles.$content.height + chipStyles.$container.paddingVertical * 2,
  } satisfies StyleProp<ViewStyle>;

  const $chipContainer = {
    flex: 1,
    gap: theme.spacing.xxs,
    alignItems: "center",
    flexWrap: "wrap",
  } satisfies StyleProp<ViewStyle>;

  const $input = {
    flex: 1,
    minWidth: theme.layout.screen.width / 4,
  } satisfies StyleProp<ViewStyle>;

  return {
    $container,
    $inputContainer,
    $toLabel,
    $chipContainer,
    $input,
  } as const;
}
