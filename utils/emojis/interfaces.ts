export type Emoji = {
  emoji: string;
  name: string;
  toneEnabled: boolean;
  keywords: string[];
};

export type CategorizedEmojisRecord = {
  id: string;
  category: string;
  emojis: Emoji[];
};
