import mmkv from "@utils/mmkv";

const FAVORITED_EMOJIS = "favoritedEmojis";

const DEFAULT_EMOJIS = ["❤️", "👍", "👎", "😂", "🤔", "😲"];

class FavoritedEmojis {
  emojis: string[] = [];
  emojisSet: Set<string> = new Set();
  constructor() {
    const savedEmojis = mmkv.getString(FAVORITED_EMOJIS);
    if (savedEmojis) {
      this.emojis = JSON.parse(savedEmojis);
    } else {
      this.emojis = DEFAULT_EMOJIS;
    }
    this.emojisSet = new Set(this.emojis);
  }

  getEmojis() {
    return this.emojis;
  }

  pushEmoji(emoji: string) {
    if (!this.emojisSet.has(emoji)) {
      this.emojis.unshift(emoji);
      this.emojis.pop();
      mmkv.set(FAVORITED_EMOJIS, JSON.stringify(this.emojis));
    }
  }

  replaceEmoji(emoji: string, index: number) {
    if (!this.emojisSet.has(emoji)) {
      this.emojis[index] = emoji;
      mmkv.set(FAVORITED_EMOJIS, JSON.stringify(this.emojis));
    }
  }

  isFavorite(emoji: string) {
    return this.emojisSet.has(emoji);
  }
}

export const favoritedEmojis = new FavoritedEmojis();
