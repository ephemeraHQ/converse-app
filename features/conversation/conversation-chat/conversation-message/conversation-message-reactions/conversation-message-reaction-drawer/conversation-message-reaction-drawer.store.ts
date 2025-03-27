import { create } from "zustand"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"

export type IMessageReactionsStore = {
  messageId: IXmtpMessageId | null
  actions: {
    setMessageId: (messageId: IXmtpMessageId | null) => void
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
