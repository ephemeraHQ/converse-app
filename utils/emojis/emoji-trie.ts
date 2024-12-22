import { Trie } from "../trie";
import { emojis } from "./emojis";
import { IEmoji } from "./emoji-types";

export const emojiTrie = new Trie<IEmoji>();

emojis.forEach((emojiSections) => {
  emojiSections.data.forEach((emoji) => {
    emoji.keywords.forEach((keyword) => {
      emojiTrie.insert(keyword, emoji);
    });
  });
});
