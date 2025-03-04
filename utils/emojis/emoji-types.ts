export type IEmoji = {
  emoji: string
  name: string
  v: string
  toneEnabled: boolean
  keywords: string[]
}

export type ICategorizedEmojisRecord = {
  id: string
  category: string
  emojis: IEmoji[]
}
