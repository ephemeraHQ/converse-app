import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import {
  Chip,
  ChipAvatar,
  ChipText,
  useChipStyles,
} from "@/design-system/chip";
import { TextInput } from "@/design-system/text-input";
import {
  useConversationStore,
  useConversationStoreContext,
} from "@/features/conversation/conversation.store-context";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  NativeSyntheticEvent,
  TextInput as RNTextInput,
  StyleProp,
  TextInputKeyPressEventData,
  ViewStyle,
} from "react-native";
import { create } from "zustand";

export const ConversationCreateSearchInput = memo(
  function ConversationCreateSearchInput() {
    const { theme } = useAppTheme();
    const styles = useConversationCreateSearchStyles();
    const inputRef = useRef<RNTextInput | null>(null);

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
      const selectedInboxIdChip = useStore.getState().selectedChipInboxId;

      if (key === "Backspace" && !searchTextValue) {
        Haptics.softImpactAsync();

        if (selectedInboxIdChip !== null) {
          // Remove selected chip
          conversationStore.setState({
            searchSelectedUserInboxIds: searchSelectedUserInboxIds.filter(
              (inboxId) => inboxId !== selectedInboxIdChip
            ),
          });
          useStore.getState().actions.setSelectedChipInboxId(null);
        } else if (searchSelectedUserInboxIds.length > 0) {
          // Select last chip for deletion
          useStore
            .getState()
            .actions.setSelectedChipInboxId(
              searchSelectedUserInboxIds[searchSelectedUserInboxIds.length - 1]
            );
        }
      } else {
        useStore.getState().actions.setSelectedChipInboxId(null);
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
      <VStack style={styles.$container}>
        <HStack style={styles.$inputContainer}>
          <Center style={styles.$toLabel}>
            <Text color="secondary">To</Text>
          </Center>
          <HStack style={styles.$chipContainer}>
            {searchSelectedUserInboxIds.map((inboxId) => (
              <UserChip key={inboxId} inboxId={inboxId} />
            ))}
            <TextInput
              ref={inputRef}
              style={styles.$input}
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
          </HStack>
        </HStack>
      </VStack>
    );
  }
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
    gap: theme.spacing.xxxs,
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

const UserChip = memo(function UserChip(props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const selectedChipInboxId = useStore((state) => state.selectedChipInboxId);

  const handlePress = useCallback(() => {
    Haptics.softImpactAsync();
    useStore.getState().actions.setSelectedChipInboxId(inboxId);
  }, [inboxId]);

  return (
    <Chip
      isSelected={selectedChipInboxId === inboxId}
      onPress={handlePress}
      size="md"
    >
      <ChipAvatar uri={profile?.avatar} name={profile?.name} />
      <ChipText>{profile?.name}</ChipText>
    </Chip>
  );
});

type IStore = {
  selectedChipInboxId: InboxId | null;
  actions: {
    setSelectedChipInboxId: (inboxId: InboxId | null) => void;
  };
};

const useStore = create<IStore>((set, get) => ({
  selectedChipInboxId: null,
  actions: {
    setSelectedChipInboxId: (inboxId) => set({ selectedChipInboxId: inboxId }),
  },
}));
