import { createContext, memo, useContext, useRef } from "react"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware"
import {
  IUploadedRemoteAttachment,
  LocalAttachment,
} from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachments.types"
import { useCurrentXmtpConversationId } from "@/features/conversation/conversation-chat/conversation.store-context"
import { IXmtpConversationId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { usePrevious } from "@/hooks/use-previous-value"
import { zustandMMKVStorage } from "@/utils/zustand/zustand"

export type IComposerMediaPreviewStatus = "picked" | "uploading" | "uploaded" | "error" | "sending"

// TODO: Maybe move in attachments and make it more generic? (without that status)
export type IComposerMediaPreview =
  | (LocalAttachment & {
      status: IComposerMediaPreviewStatus
    })
  | null

type IConversationComposerStoreProps = {
  inputValue?: string
}

type IConversationComposerState = IConversationComposerStoreProps & {
  inputValue: string
  replyingToMessageId: IXmtpMessageId | null
  composerMediaPreviews: IComposerMediaPreview[]
  composerUploadedAttachments: IUploadedRemoteAttachment[]
}

type IConversationComposerActions = {
  reset: () => void
  setInputValue: (value: string) => void
  setReplyToMessageId: (messageId: IXmtpMessageId | null) => void
  addComposerMediaPreview: (mediaPreview: NonNullable<IComposerMediaPreview>) => string
  removeComposerMediaPreview: (mediaURI: string) => void
  addComposerUploadedAttachment: (args: {
    mediaURI: string
    attachment: IUploadedRemoteAttachment
  }) => void
  updateMediaPreviewStatus: (mediaURI: string, status: IComposerMediaPreviewStatus) => void
}

type IConversationComposerStoreState = IConversationComposerState & IConversationComposerActions

type IConversationComposerStoreProviderProps =
  React.PropsWithChildren<IConversationComposerStoreProps>

type IConversationComposerStore = ReturnType<typeof createConversationComposerStore>

export const ConversationComposerStoreProvider = memo(
  ({ children, ...props }: IConversationComposerStoreProviderProps) => {
    const storeRef = useRef<IConversationComposerStore>()
    const xmtpConversationId = useCurrentXmtpConversationId()
    const previousTopic = usePrevious(xmtpConversationId)

    // Create a new store when topic changes
    if (!storeRef.current || xmtpConversationId !== previousTopic) {
      storeRef.current = createConversationComposerStore({
        ...props,
        storeName: getStoreName(xmtpConversationId),
      })
    }

    return (
      <ConversationComposerStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationComposerStoreContext.Provider>
    )
  },
)

const createConversationComposerStore = (
  initProps: IConversationComposerStoreProps & { storeName: string },
) => {
  const DEFAULT_STATE: IConversationComposerState = {
    inputValue: initProps.inputValue ?? "",
    composerMediaPreviews: [],
    composerUploadedAttachments: [],
    replyingToMessageId: null,
  }

  return createStore<IConversationComposerStoreState>()(
    subscribeWithSelector(
      persist(
        (set) => ({
          ...DEFAULT_STATE,
          reset: () =>
            set((state) => ({
              ...state,
              ...DEFAULT_STATE,
            })),
          setInputValue: (value) => set({ inputValue: value }),
          setReplyToMessageId: (messageId) => set({ replyingToMessageId: messageId }),
          addComposerMediaPreview: (mediaPreview) => {
            set((state) => ({
              composerMediaPreviews: [...state.composerMediaPreviews, mediaPreview],
            }))
            return mediaPreview.mediaURI
          },
          removeComposerMediaPreview: (mediaURI) =>
            set((state) => ({
              composerMediaPreviews: state.composerMediaPreviews.filter(
                (preview) => preview?.mediaURI !== mediaURI,
              ),
              composerUploadedAttachments: state.composerUploadedAttachments.filter(
                (attachment) => attachment.url !== mediaURI,
              ),
            })),
          addComposerUploadedAttachment: ({ mediaURI, attachment }) =>
            set((state) => ({
              composerUploadedAttachments: [...state.composerUploadedAttachments, attachment],
            })),
          updateMediaPreviewStatus: (mediaURI, status) =>
            set((state) => ({
              composerMediaPreviews: state.composerMediaPreviews.map((preview) =>
                preview?.mediaURI === mediaURI ? { ...preview, status } : preview,
              ),
            })),
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: initProps.storeName,
          partialize: (state) => ({
            inputValue: state.inputValue,
            replyingToMessageId: state.replyingToMessageId,
            composerMediaPreviews: state.composerMediaPreviews,
            composerUploadedAttachments: state.composerUploadedAttachments,
          }),
        },
      ),
    ),
  )
}

function getStoreName(xmtpConversationId: IXmtpConversationId | null) {
  return xmtpConversationId ? `composer-${xmtpConversationId}` : "new"
}

const ConversationComposerStoreContext = createContext<IConversationComposerStore | null>(null)

export function useConversationComposerStoreContext<T>(
  selector: (state: IConversationComposerStoreState) => T,
): T {
  const store = useContext(ConversationComposerStoreContext)
  if (!store) throw new Error("Missing ConversationComposerStore.Provider in the tree")
  return useStore(store, selector)
}

export function useConversationComposerStore() {
  const store = useContext(ConversationComposerStoreContext)
  if (!store) throw new Error()
  return store
}
