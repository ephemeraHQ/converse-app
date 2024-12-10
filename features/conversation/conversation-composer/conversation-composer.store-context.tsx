import { LocalAttachment } from "@/utils/attachment/types";
import { zustandMMKVStorage } from "@utils/mmkv";
import { MessageId, RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

export type IComposerMediaPreviewStatus =
  | "picked"
  | "uploading"
  | "uploaded"
  | "error"
  | "sending";

// TODO: Maybe move in attachments and make it more generic? (without that status)
export type IComposerMediaPreview =
  | (LocalAttachment & {
      status: IComposerMediaPreviewStatus;
    })
  | null;

type IConversationComposerStoreProps = {
  storeName: string;
  inputValue?: string;
};

type IConversationComposerState = IConversationComposerStoreProps & {
  inputValue: string;
  storeName: string;
  replyingToMessageId: MessageId | null;
  composerMediaPreview: IComposerMediaPreview;
  composerUploadedAttachment: RemoteAttachmentContent | null;
};

type IConversationComposerActions = {
  reset: () => void;
  setInputValue: (value: string) => void;
  setReplyToMessageId: (messageId: MessageId | null) => void;
  setComposerMediaPreview: (mediaPreview: IComposerMediaPreview) => void;
  setComposerUploadedAttachment: (
    attachment: RemoteAttachmentContent | null
  ) => void;
  updateMediaPreviewStatus: (status: IComposerMediaPreviewStatus) => void;
};

type IConversationComposerStoreState = IConversationComposerState &
  IConversationComposerActions;

type IConversationComposerStoreProviderProps =
  React.PropsWithChildren<IConversationComposerStoreProps>;

type IConversationComposerStore = ReturnType<
  typeof createConversationComposerStore
>;

export const ConversationComposerStoreProvider = memo(
  ({ children, ...props }: IConversationComposerStoreProviderProps) => {
    const storeRef = useRef<IConversationComposerStore>();
    if (!storeRef.current) {
      storeRef.current = createConversationComposerStore(props);
    }
    return (
      <ConversationComposerStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationComposerStoreContext.Provider>
    );
  }
);

const createConversationComposerStore = (
  initProps: IConversationComposerStoreProps
) => {
  const DEFAULT_STATE: IConversationComposerState = {
    storeName: initProps.storeName,
    inputValue: initProps.inputValue ?? "",
    composerMediaPreview: null,
    composerUploadedAttachment: null,
    replyingToMessageId: null,
  };

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
          setReplyToMessageId: (messageId) =>
            set({ replyingToMessageId: messageId }),
          setComposerMediaPreview: (mediaPreview) =>
            set({ composerMediaPreview: mediaPreview }),
          setComposerUploadedAttachment: (attachment) =>
            set({ composerUploadedAttachment: attachment }),
          updateMediaPreviewStatus: (status) =>
            set((state) => ({
              ...state,
              composerMediaPreview: {
                ...state.composerMediaPreview!,
                status,
              },
            })),
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: initProps.storeName,
          partialize: (state) => ({
            inputValue: state.inputValue,
            replyingToMessageId: state.replyingToMessageId,
            composerMediaPreview: state.composerMediaPreview,
            composerUploadedAttachment: state.composerUploadedAttachment,
          }),
        }
      )
    )
  );
};

const ConversationComposerStoreContext =
  createContext<IConversationComposerStore | null>(null);

export function useConversationComposerStoreContext<T>(
  selector: (state: IConversationComposerStoreState) => T
): T {
  const store = useContext(ConversationComposerStoreContext);
  if (!store)
    throw new Error("Missing ConversationComposerStore.Provider in the tree");
  return useStore(store, selector);
}

export function useConversationComposerStore() {
  const store = useContext(ConversationComposerStoreContext);
  if (!store) throw new Error();
  return store;
}
