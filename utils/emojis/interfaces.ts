export interface Emoji {
  emoji: string;
  name: string;
  toneEnabled: boolean;
  keywords: string[];
}

export interface CategorizedEmojisRecord {
  id: string;
  category: string;
  emojis: Emoji[];
}
