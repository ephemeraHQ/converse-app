import { MessageToDisplay } from "@components/Chat/Message/Message";
import { Drawer, DrawerRef } from "@components/Drawer";
import SearchBar from "@components/NewConversation/SearchBar";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { textPrimaryColor } from "@styles/colors";
import { ReanimatedFlashList, ReanimatedView } from "@utils/animations";
import { useConversationContext } from "@utils/conversation";
import { emojis } from "@utils/emojis/emojis";
import { favoritedEmojis } from "@utils/emojis/favoritedEmojis";
import {
  addReactionToMessage,
  getMessageReactions,
  getReactionContent,
  removeReactionFromMessage,
} from "@utils/reactions";
import { FC, useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Emoji {
  emoji: string;
  name: string;
  toneEnabled: boolean;
  keywords: string[];
}

interface CategorizedEmojisRecord {
  id: string;
  category: string;
  emojis: Emoji[];
}

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

interface EmojiRowListProps {
  emojis: CategorizedEmojisRecord[];
  ListHeader?: React.ReactNode;
  onPress: (emoji: string) => void;
}

const EmojiRowList: FC<EmojiRowListProps> = ({
  emojis,
  ListHeader,
  onPress,
}) => {
  const styles = useStyles();
  const { height: windowHeight } = useWindowDimensions();
  const height = Math.min(emojis.length * 50, windowHeight * 0.75);
  return (
    <ReanimatedView style={{ height }}>
      <ReanimatedFlashList
        ListHeaderComponent={() => ListHeader}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={50}
        data={emojis}
        scrollEnabled={emojis.length > 1}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              height: 50,
            }}
          >
            {item.emojis.map((emoji) => (
              <Pressable
                key={emoji.emoji}
                onPress={() => onPress(emoji.emoji)}
                style={{ width: "auto", marginHorizontal: 8 }}
              >
                <Text style={styles.listEmoji}>{emoji.emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
      />
    </ReanimatedView>
  );
};

export const EmojiPicker = ({ message }: { message: MessageToDisplay }) => {
  const currentUser = useCurrentAccount();
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
          keyword.includes(searchInput.toLowerCase())
        )
      )
    );
  }, [searchInput]);
  const insets = useSafeAreaInsets();
  const closeMenu = useCallback(() => {
    setReactMenuMessageId(null);
  }, [setReactMenuMessageId]);
  const { conversation } = useConversationContext(["conversation"]);
  const handleReaction = useCallback(
    (emoji: string) => {
      console.log("handleReaction", conversation, message, emoji);
      if (!conversation) return;
      const alreadySelected = currentUserEmojiMap[emoji];
      if (alreadySelected) {
        removeReactionFromMessage(conversation, message, emoji);
      } else {
        addReactionToMessage(conversation, message, emoji);
      }
      drawerRef?.current?.closeDrawer(closeMenu);
    },
    [conversation, message, currentUserEmojiMap, closeMenu]
  );
  const { height } = useWindowDimensions();

  return (
    <Drawer visible={visible} onClose={closeMenu} ref={drawerRef}>
      <SearchBar
        value={searchInput}
        setValue={setSearchInput}
        inputPlaceholder="Search"
        onRef={() => {}}
      />
      <View style={{ flex: 1, maxHeight: height * 0.75, height: "auto" }}>
        {searchInput.length > 0 ? (
          <EmojiRowList emojis={filteredReactions} onPress={handleReaction} />
        ) : (
          <>
            <EmojiRowList
              emojis={categorizedEmojis}
              onPress={handleReaction}
              ListHeader={
                <>
                  <Text style={styles.headerText}>Your Reactions</Text>
                  <EmojiRowList emojis={myEmojis} onPress={handleReaction} />
                  <Text style={styles.headerText}>All</Text>
                </>
              }
            />
          </>
        )}
        <View style={{ height: insets.bottom }} />
      </View>
    </Drawer>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    textInput: {
      width: "100%",
      color: textPrimaryColor(colorScheme),
      fontSize: Platform.OS === "android" ? 16 : 17,
      paddingHorizontal: 12,
      lineHeight: 22,
      paddingVertical: Platform.OS === "android" ? 4 : 7,
      zIndex: 1,
    },
    searchEmoji: {
      fontSize: 32,
    },
    listEmoji: {
      fontSize: 40,
      flexGrow: 1,
    },
    headerText: {
      fontSize: 12,
      fontWeight: "bold",
      padding: 8,
    },
  });
};
