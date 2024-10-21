import { Drawer, DrawerRef } from "@components/Drawer";
import { EmojiRowList } from "@components/EmojiPicker/EmojiRowList";
import { EmojiSearchBar } from "@components/EmojiPicker/EmojiSearchBar";
import { useSelect } from "@data/store/storeHelpers";
import {
  useChatStore,
  useCurrentAccount,
} from "@features/accounts/accounts.store";
import { textSecondaryColor } from "@styles/colors";
import { emojis } from "@utils/emojis/emojis";
import { CategorizedEmojisRecord, Emoji } from "@utils/emojis/interfaces";
import {
  addReactionToMessage,
  getMessageReactions,
  getReactionContent,
  removeReactionFromMessage,
} from "@utils/reactions";
import { matchSorter } from "match-sorter";
import { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Text } from "react-native-paper";

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

// const myEmojis = sliceEmojis(
//   flatEmojis.filter((emoji) => favoritedEmojis.isFavorite(emoji.emoji))
// );

export const EmojiPicker = () => {
  const currentUser = useCurrentAccount() as string;
  const { reactingToMessage, setReactingToMessage } = useChatStore(
    useSelect(["reactingToMessage", "setReactingToMessage"])
  );
  const drawerRef = useRef<DrawerRef>(null);
  const [searchInput, setSearchInput] = useState("");
  const visible = !!reactingToMessage;
  const styles = useStyles();
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

  const filteredReactions = useMemo(() => {
    const cleanedSearch = searchInput.toLowerCase().trim();
    if (cleanedSearch.length === 0) {
      return sliceEmojis(flatEmojis);
    }
    return sliceEmojis(
      matchSorter(flatEmojis, cleanedSearch, {
        keys: ["keywords", "name", "emoji"],
      })
    );
  }, [searchInput]);
  const closeMenu = useCallback(() => {
    setReactingToMessage(null);
    setSearchInput("");
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
      drawerRef?.current?.closeDrawer(closeMenu);
    },
    [closeMenu, conversation, currentUser, currentUserEmojiMap, message]
  );

  return (
    <Drawer visible={visible} onClose={closeMenu} ref={drawerRef}>
      <EmojiSearchBar value={searchInput} setValue={setSearchInput} />
      <View style={styles.container}>
        {searchInput.length > 0 ? (
          <EmojiRowList emojis={filteredReactions} onPress={handleReaction} />
        ) : (
          <>
            <EmojiRowList
              emojis={categorizedEmojis}
              onPress={handleReaction}
              ListHeader={
                <>
                  {/* Removing until customization is ready */}
                  {/* <Text style={styles.headerText}>Your Reactions</Text>
                  <EmojiRowList emojis={myEmojis} onPress={handleReaction} /> */}
                  <Text style={styles.headerText}>All</Text>
                </>
              }
            />
          </>
        )}
      </View>
    </Drawer>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      height: "auto",
    },
    headerText: {
      fontSize: 13,
      padding: 8,
      color: textSecondaryColor(colorScheme),
    },
  });
};
