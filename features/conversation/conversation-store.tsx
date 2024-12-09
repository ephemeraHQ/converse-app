/**
 * Store to handle the conversation state.
 * Will be used for both DM and group conversations.
 */

import {
  ConversationTopic,
  MessageId,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type IConversationStoreProps = {
  topic: ConversationTopic;
};

type IConversationStoreState = IConversationStoreProps & {
  uploadedRemoteAttachment: RemoteAttachmentContent | null;
  messageContextMenuData: {
    messageId: MessageId;
    itemRectX: number;
    itemRectY: number;
    itemRectHeight: number;
    itemRectWidth: number;
    messageComponent: React.ReactNode;
  } | null;
  pickingEmojiForMessageId: MessageId | null;
};

type IConversationStoreProviderProps =
  React.PropsWithChildren<IConversationStoreProps>;

type IConversationStore = ReturnType<typeof createConversationStore>;

export const ConversationStoreProvider = memo(
  ({ children, ...props }: IConversationStoreProviderProps) => {
    const storeRef = useRef<IConversationStore>();
    if (!storeRef.current) {
      storeRef.current = createConversationStore(props);
    }
    return (
      <ConversationStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationStoreContext.Provider>
    );
  }
);

const createConversationStore = (initProps: IConversationStoreProps) => {
  return createStore<IConversationStoreState>()(
    subscribeWithSelector((set) => ({
      uploadedRemoteAttachment: null,
      messageContextMenuData: null,
      pickingEmojiForMessageId: null,
      ...initProps,
    }))
  );
};

const ConversationStoreContext = createContext<IConversationStore | null>(null);

export function useConversationStoreContext<T>(
  selector: (state: IConversationStoreState) => T
): T {
  const store = useContext(ConversationStoreContext);
  if (!store) throw new Error("Missing ConversationStore.Provider in the tree");
  return useStore(store, selector);
}

export function useConversationStore() {
  const store = useContext(ConversationStoreContext);
  if (!store) throw new Error();
  return store;
}
