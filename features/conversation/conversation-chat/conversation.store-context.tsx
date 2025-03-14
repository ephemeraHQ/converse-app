import { createContext, memo, useContext, useEffect, useRef } from "react"
import { createStore, useStore } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { findConversationByInboxIds } from "@/features/conversation/utils/find-conversations-by-inbox-ids"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { getSafeCurrentSender } from "../../authentication/multi-inbox.store"
import { IConversationTopic } from "../conversation.types"
import { IConversationMessageId } from "./conversation-message/conversation-message.types"

type IConversationStoreProps = {
  topic?: IConversationTopic | null
  highlightedMessageId?: IConversationMessageId | null
  scrollToMessageId?: IConversationMessageId | null
  searchSelectedUserInboxIds?: IXmtpInboxId[]
  isCreatingNewConversation?: boolean
}

type IConversationStoreState = Required<IConversationStoreProps> & {
  searchTextValue: string
}

type IConversationStoreProviderProps = React.PropsWithChildren<IConversationStoreProps>

type IConversationStore = ReturnType<typeof createConversationStore>

export const ConversationStoreProvider = memo(
  ({ children, ...props }: IConversationStoreProviderProps) => {
    const storeRef = useRef<IConversationStore>()
    if (!storeRef.current) {
      storeRef.current = createConversationStore(props)
    }

    useEffect(() => {
      storeRef.current?.subscribe(async (nextState, previousState) => {
        try {
          if (
            !nextState.searchSelectedUserInboxIds ||
            nextState.searchSelectedUserInboxIds.length ===
              previousState.searchSelectedUserInboxIds?.length
          ) {
            return
          }

          const currentSender = getSafeCurrentSender()

          const conversation = await findConversationByInboxIds({
            inboxIds: [currentSender.inboxId, ...nextState.searchSelectedUserInboxIds],
            clientInboxId: currentSender.inboxId,
          })

          storeRef.current?.setState({
            topic: conversation?.topic ?? null,
          })
        } catch (error) {
          captureError(error)
        }
      })
    }, [])

    return (
      <ConversationStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationStoreContext.Provider>
    )
  },
)

const createConversationStore = (initProps: IConversationStoreProps) => {
  return createStore<IConversationStoreState>()(
    subscribeWithSelector((set) => ({
      topic: null,
      highlightedMessageId: null,
      scrollToMessageId: null,
      searchSelectedUserInboxIds: [],
      isCreatingNewConversation: false,
      searchTextValue: "",
      ...initProps,
    })),
  )
}

const ConversationStoreContext = createContext<IConversationStore | null>(null)

export function useConversationStoreContext<T>(selector: (state: IConversationStoreState) => T): T {
  const store = useContext(ConversationStoreContext)
  if (!store) throw new Error("Missing ConversationStore.Provider in the tree")
  return useStore(store, selector)
}

export function useConversationStore() {
  const store = useContext(ConversationStoreContext)
  if (!store) throw new Error(`Missing ConversationStore.Provider in the tree`)
  return store
}

export function useCurrentConversationTopic() {
  return useConversationStoreContext((state) => state.topic)
}

export function useCurrentConversationTopicSafe() {
  return useCurrentConversationTopic()! // ! Because at this point we must have a topic to show this
}
