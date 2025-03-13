import { create } from "zustand"
import { IConversationMessageId } from "../../conversation-message.types"

export type IMessageReactionsStore = {
  messageId: IConversationMessageId | null
  actions: {
    setMessageId: (messageId: IConversationMessageId | null) => void
  }
}

export const useMessageReactionsStore = create<IMessageReactionsStore>((set) => ({
  messageId: null,
  actions: {
    setMessageId: (messageId) => set({ messageId }),
  },
}))

export function resetMessageReactionsStore() {
  useMessageReactionsStore.setState({
    messageId: null,
  })
}
