import { EmojiRowList } from "@components/EmojiPicker/EmojiRowList";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";
import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { Text } from "@design-system/Text";
import { TextField } from "@design-system/TextField/TextField";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { emojis } from "@utils/emojis/emojis";
import { CategorizedEmojisRecord, Emoji } from "@utils/emojis/interfaces";
import {
  addReactionToMessage,
  getMessageReactions,
  getReactionContent,
  removeReactionFromMessage,
} from "@utils/reactions";
import { matchSorter } from "match-sorter";
import { debounce } from "perfect-debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TextInput, ViewStyle, TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const flatEmojis = emojis.flatMap((category) => category.data);

const categorizedEmojis: CategorizedEmojisRecord[] = [];
emojis.forEach((category, index) => {
  for (let i = 0; i < category.data.length; i += 6) {
    const slicedEmojis = category.data.slice(i, i + 6).map((emoji) => emoji);
    categorizedEmojis.push({
      id: category.title + index,
      category: category.title,
      emojis: slicedEmojis,
    });
  }
});

const sliceEmojis = (emojis: Emoji[]) => {
  const slicedEmojis: CategorizedEmojisRecord[] = [];
  for (let i = 0; i < emojis.length; i += 6) {
    const sliced = emojis.slice(i, i + 6).map((emoji) => emoji);
    slicedEmojis.push({
      id: emojis[i].emoji,
      category: emojis[i].emoji,
      emojis: sliced,
    });
  }
  return slicedEmojis;
};

const filterEmojis = (text: string) => {
  const cleanedSearch = text.toLowerCase().trim();
  if (cleanedSearch.length === 0) {
    return sliceEmojis(flatEmojis);
  }
  return sliceEmojis(
    matchSorter(flatEmojis, cleanedSearch, {
      keys: ["keywords", "name", "emoji"],
    })
  );
};

const defaultEmojis = sliceEmojis(flatEmojis);

// const myEmojis = sliceEmojis(
//   flatEmojis.filter((emoji) => favoritedEmojis.isFavorite(emoji.emoji))
// );

export const EmojiPicker = () => {
  const currentUser = useCurrentAccount() as string;
  const { reactingToMessage, setReactingToMessage } = useChatStore(
    useSelect(["reactingToMessage", "setReactingToMessage"])
  );

  const bottomSheetRef = useBottomSheetModalRef();
  const textInputRef = useRef<TextInput>(null);

  const insets = useSafeAreaInsets();
  const { themed } = useAppTheme();

  const [filteredReactions, setFilteredReactions] = useState(defaultEmojis);
  const [hasInput, setHasInput] = useState(false);

  useEffect(() => {
    if (reactingToMessage) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
      setHasInput(false);
      setFilteredReactions(defaultEmojis);
    }
  }, [reactingToMessage, bottomSheetRef]);

  const conversation = useChatStore((s) =>
    reactingToMessage ? s.conversations[reactingToMessage.topic] : undefined
  );

  const message = useChatStore((s) =>
    reactingToMessage && conversation
      ? conversation.messages.get(reactingToMessage.messageId)
      : undefined
  );

  const reactions = useMemo(() => {
    return message ? getMessageReactions(message) : {};
  }, [message]);

  const currentUserEmojiMap = useMemo(() => {
    const emojiSet: Record<string, boolean> = {};
    if (!currentUser) {
      return emojiSet;
    }
    const userReactions = reactions[currentUser];
    if (!userReactions) {
      return emojiSet;
    }
    for (const reaction of userReactions) {
      emojiSet[getReactionContent(reaction)] = true;
    }
    return emojiSet;
  }, [reactions, currentUser]);

  const closeMenu = useCallback(() => {
    setReactingToMessage(null);
    textInputRef.current?.blur();
  }, [setReactingToMessage]);

  const handleReaction = useCallback(
    (emoji: string) => {
      if (!conversation || !message) return;
      const alreadySelected = currentUserEmojiMap[emoji];
      if (alreadySelected) {
        removeReactionFromMessage(currentUser, message, emoji);
      } else {
        addReactionToMessage(currentUser, message, emoji);
      }
      bottomSheetRef?.current?.dismiss();
      closeMenu();
    },
    [
      conversation,
      currentUser,
      currentUserEmojiMap,
      message,
      bottomSheetRef,
      closeMenu,
    ]
  );

  const debouncedFilter = useMemo(
    () =>
      debounce((value: string) => {
        setFilteredReactions(filterEmojis(value));
        setHasInput(value.length > 0);
      }, 150),
    []
  );

  const onTextInputChange = useCallback(
    (value: string) => {
      debouncedFilter(value);
    },
    [debouncedFilter]
  );

  return (
    <BottomSheetModal
      onClose={closeMenu}
      ref={bottomSheetRef}
      topInset={insets.top}
      snapPoints={["40%", "100%"]}
    >
      <BottomSheetContentContainer>
        <BottomSheetHeader title={translate("choose_reaction")} hasClose />
        <TextField
          ref={textInputRef}
          onChangeText={onTextInputChange}
          placeholder={translate("search_emojis")}
          clearButtonMode="always"
          containerStyle={themed($inputContainer)}
        />
      </BottomSheetContentContainer>

      <VStack style={themed($container)}>
        {hasInput ? (
          <EmojiRowList emojis={filteredReactions} onPress={handleReaction} />
        ) : (
          <EmojiRowList
            emojis={categorizedEmojis}
            onPress={handleReaction}
            ListHeader={
              <Text preset="smaller" style={themed($headerText)}>
                {translate("emoji_picker_all")}
              </Text>
            }
          />
        )}
      </VStack>
    </BottomSheetModal>
  );
};

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xxs,
  marginHorizontal: spacing.xxs,
});

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.xxs,
});

const $headerText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginLeft: spacing.sm,
});
