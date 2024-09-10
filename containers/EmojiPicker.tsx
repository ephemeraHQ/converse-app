import { MessageToDisplay } from "@components/Chat/Message/Message";
import { Drawer, DrawerRef } from "@components/Drawer";
import { EmojiRowList } from "@components/EmojiPicker/EmojiRowList";
import { EmojiSearchBar } from "@components/EmojiPicker/EmojiSearchBar";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { textSecondaryColor } from "@styles/colors";
import { useConversationContext } from "@utils/conversation";
import { emojis } from "@utils/emojis/emojis";
import { favoritedEmojis } from "@utils/emojis/favoritedEmojis";
import { CategorizedEmojisRecord, Emoji } from "@utils/emojis/interfaces";
import {
  addReactionToMessage,
  getMessageReactions,
  getReactionContent,
  removeReactionFromMessage,
} from "@utils/reactions";
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

const myEmojis = sliceEmojis(
  flatEmojis.filter((emoji) => favoritedEmojis.isFavorite(emoji.emoji))
);

export const EmojiPicker = ({ message }: { message: MessageToDisplay }) => {
  const currentUser = useCurrentAccount() as string;
  const { reactionMenuMessageId, setReactMenuMessageId } = useChatStore(
    useSelect(["reactionMenuMessageId", "setReactMenuMessageId"])
  );
  const drawerRef = useRef<DrawerRef>(null);
  const [searchInput, setSearchInput] = useState("");
  const visible = reactionMenuMessageId === message.id;
  const styles = useStyles();
  const reactions = useMemo(() => {
    return getMessageReactions(message);
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
    return sliceEmojis(
      flatEmojis.filter((emoji) =>
        emoji.keywords.some((keyword) =>
          keyword.includes(searchInput.toLowerCase().trim())
        )
      )
    );
  }, [searchInput]);
  const closeMenu = useCallback(() => {
    setReactMenuMessageId(null);
    setSearchInput("");
  }, [setReactMenuMessageId]);
  const { conversation } = useConversationContext(["conversation"]);
  const handleReaction = useCallback(
    (emoji: string) => {
      if (!conversation) return;
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
