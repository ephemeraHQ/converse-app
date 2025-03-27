import { createContext, memo, useContext, useRef } from "react"
import { createStore, useStore } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"

type IConversationMessageContextMenuStoreProps = {}

export type IConversationMessageContextMenuStoreState =
  IConversationMessageContextMenuStoreProps & {
    messageContextMenuData: {
      messageId: IXmtpMessageId
      itemRectX: number
      itemRectY: number
      itemRectHeight: number
      itemRectWidth: number
      extra?: Record<string, any>
    } | null
    setMessageContextMenuData: (
      data: IConversationMessageContextMenuStoreState["messageContextMenuData"],
    ) => void
  }

type IConversationMessageContextMenuStoreProviderProps =
  React.PropsWithChildren<IConversationMessageContextMenuStoreProps>

type IConversationMessageContextMenuStore = ReturnType<
  typeof createConversationMessageContextMenuStore
>

export const ConversationMessageContextMenuStoreProvider = memo(
  ({ children, ...props }: IConversationMessageContextMenuStoreProviderProps) => {
    const storeRef = useRef<IConversationMessageContextMenuStore>()
    if (!storeRef.current) {
      storeRef.current = createConversationMessageContextMenuStore(props)
    }
    return (
      <ConversationMessageContextMenuStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationMessageContextMenuStoreContext.Provider>
    )
  },
)

const createConversationMessageContextMenuStore = (
  initProps: IConversationMessageContextMenuStoreProps,
) => {
  return createStore<IConversationMessageContextMenuStoreState>()(
    subscribeWithSelector((set) => ({
      messageContextMenuData: null,
      setMessageContextMenuData: (data) => set({ messageContextMenuData: data }),
      ...initProps,
    })),
  )
}

const ConversationMessageContextMenuStoreContext =
  createContext<IConversationMessageContextMenuStore | null>(null)

export function useConversationMessageContextMenuStoreContext<T>(
  selector: (state: IConversationMessageContextMenuStoreState) => T,
): T {
  const store = useContext(ConversationMessageContextMenuStoreContext)
  if (!store) throw new Error("Missing ConversationMessageContextMenuStore.Provider in the tree")
  return useStore(store, selector)
}

export function useConversationMessageContextMenuStore() {
  const store = useContext(ConversationMessageContextMenuStoreContext)
  if (!store) throw new Error(`Missing ConversationMessageContextMenuStore.Provider in the tree`)
  return store
}
