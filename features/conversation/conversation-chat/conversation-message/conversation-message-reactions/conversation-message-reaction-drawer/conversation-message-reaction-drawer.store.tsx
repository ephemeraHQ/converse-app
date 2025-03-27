import { MessageId } from "@xmtp/react-native-sdk"
import { create } from "zustand"
import { RolledUpReactions } from "../conversation-message-reactions.types"

const initialMessageReactionsState: RolledUpReactions = {
  totalCount: 0,
  userReacted: false,
  preview: [],
  detailed: [],
  messageId: "" as MessageId,
}

export type IMessageReactionsStore = {
  rolledUpReactions: RolledUpReactions
  setRolledUpReactions: (reactions: RolledUpReactions) => void

  // TODO: update state when new reactions come up and drawer is open
  // updateReactions: (updates: Partial<RolledUpReactions>) => void;
}

export const useMessageReactionsStore = create<IMessageReactionsStore>((set) => ({
  rolledUpReactions: initialMessageReactionsState,
  setRolledUpReactions: (reactions) => set({ rolledUpReactions: reactions }),
}))

export const resetMessageReactionsStore = () => {
  useMessageReactionsStore.getState().setRolledUpReactions(initialMessageReactionsState)
}
