import { Trie } from "../trie"
import { IEmoji } from "./emoji-types"
import { emojis } from "./emojis"

export const emojiTrie = new Trie<IEmoji>()

emojis.forEach((emojiSections) => {
  emojiSections.data.forEach((emoji) => {
    emoji.keywords.forEach((keyword) => {
      emojiTrie.insert(keyword, emoji)
    })
  })
})
