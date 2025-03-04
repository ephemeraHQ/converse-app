import { MessageId } from "@xmtp/react-native-sdk"
import { create } from "zustand"

export type IMessageReactionsStore = {
  messageId: MessageId | null
  actions: {
    setMessageId: (messageId: MessageId | null) => void
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
